import React, {
  useCallback,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  memo
} from 'react'
import { App, Upload } from 'antd'
import { MIconFolder } from '@/components/icons'
import { UPLOAD_BASE_URL, UPLOAD_FILE_TYPE } from '@/constants/upload'
import { UploadFileResponse } from '@/types/upload'
import { batchUploadFilesWithPresigned } from '@/api/client/upload'
import type { UploadFile } from 'antd'
const { Dragger } = Upload

const DEBOUNCE_TIME = 100

// 生成文件唯一标识
const getFileKey = (file: File) =>
  // `${file.name}_${file.size}_${file.lastModified}`
  encodeURIComponent(`${file.name}_${file.size}`)

// 防抖检查
const shouldDebounce = () => {
  const now = Date.now()
  const lastTime = (window as any).__lastUploadTime || 0
  if (now - lastTime < DEBOUNCE_TIME) return true
  ;(window as any).__lastUploadTime = now
  return false
}

const UploadMultipleFiles = memo(
  forwardRef(function UploadMultipleFiles(
    {
      icon,
      title,
      typesInfo,
      browseFiles,
      staticPath,
      aspect,
      maxCount = 10,
      onFilesChange,
      defaultFileList = []
    }: {
      icon?: React.ReactNode
      title: string
      typesInfo: string
      browseFiles?: boolean
      staticPath: string
      aspect?: number
      maxCount?: number
      onFilesChange: (files: UploadFileResponse[]) => void
      defaultFileList?: any[]
    },
    ref
  ) {
    const { message } = App.useApp()

    // 文件列表
    const [fileList, setFileList] = useState<UploadFileResponse[]>([])

    // 已缓存的文件列表，
    // 缓存策略：成功或失败都缓存，失败的手动点击重试
    const [processedFiles, setProcessedFiles] = useState<Set<string>>(
      new Set([])
    )
    // 是否正在上传到服务器
    const [uploading, setUploading] = useState(false)

    // 初始化默认值
    useEffect(() => {
      setFileList(defaultFileList)
      setProcessedFiles(new Set(defaultFileList.map(file => getFileKey(file))))
    }, [defaultFileList])

    // 实时更新UI状态
    // 第一次默认值渲染时，不触发 onFilesChange
    const isFirstRender = useRef(defaultFileList.length > 0)
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      const res = transformFiles(fileList as any)
      onFilesChange(res)
    }, [fileList])

    // 文件验证
    const validateFiles = useCallback(
      (files: File[]) => {
        const errors: string[] = []

        const validFiles = files.filter(file => {
          if (!file.type.startsWith('image/')) {
            errors.push(`${file.name} 不是图片文件`)
            return false
          }
          return true
        })

        const currentTotal = fileList.length + validFiles.length
        if (currentTotal > maxCount) {
          errors.push(`最多只能上传 ${maxCount} 张图片`)
          return []
        }

        if (errors.length > 0) {
          errors.forEach(error => message.error(error))
        }

        return validFiles
      },
      [fileList.length, maxCount]
    )

    // 工具函数：根据 getFileKey 去重 File 数组
    function deduplicateFiles(files: File[], processedKeys?: Set<string>) {
      console.log('cached files: ', processedFiles)
      // done 状态只做本次列表的去重，不做换成去重
      const cachedKeys = processedKeys
        ? new Set(processedKeys)
        : new Set<string>()
      return files.filter(file => {
        const key = getFileKey(file)
        if (cachedKeys.has(key)) {
          console.log(`文件 ${file.name} 已缓存，如果失败，请手动上传`)
          return false
        }
        cachedKeys.add(key)
        return true
      })
    }

    // 标记文件为已缓存
    const markFilesAsProcessed = useCallback(
      (files: File[]) => {
        const newProcessedFiles = new Set(processedFiles)
        files.forEach(file => newProcessedFiles.add(getFileKey(file)))
        setProcessedFiles(newProcessedFiles)
      },
      [processedFiles]
    )

    // 清理已处理文件标记
    const clearProcessedFiles = useCallback(() => {
      setProcessedFiles(new Set())
      console.log('已清理文件缓存')
    }, [])

    // 格式转换
    const transformFiles = (files: File[]) => {
      // console.log('transformFiles: ', files)
      return files.map((file: any) => ({
        uid: getFileKey(file),
        name: file.name,
        status: file?.status ?? 'uploading',
        progress: file?.progress || 0,
        fileName: file.name,
        key: file?.key || '',
        url: file?.key ? file.key : '',
        size: file.size,
        type: file.type,
        success: file.success,
        error: file?.error || undefined,
        lastModified: file?.lastModified || undefined
      }))
    }

    // uploading 状态只做 UI 展示
    const processFilesForUI = useCallback(
      (files: File[]) => {
        if (files.length === 0) return

        // 去重
        const uniqueFiles = deduplicateFiles(files, processedFiles)
        if (uniqueFiles.length === 0) return

        // 验证
        const validFiles = validateFiles(uniqueFiles)
        if (validFiles.length === 0) return

        // 缓存
        markFilesAsProcessed(validFiles)

        console.log('validFiles: ', validFiles)

        // 设置状态为 uploading
        const validFilesWithStatus = validFiles.map(f => {
          ;(f as any).status = 'uploading'
          return f
        })

        console.log('processFilesForUI: ', validFilesWithStatus)
        setFileList(prev => {
          const existingKeys = new Set(prev.map(f => f.uid))
          const newUploading = transformFiles(validFilesWithStatus).filter(
            f => !existingKeys.has(f.uid)
          )
          return [...prev, ...newUploading]
        })
      },
      [processedFiles, validateFiles, markFilesAsProcessed]
    )

    // 批量上传逻辑抽离出来
    const handleBatchUpload = useCallback(
      async (files: UploadFile[], isReupload = false) => {
        try {
          // 判断所有文件是否都 done 或 error，批量上传
          const isAllFinished = files.every(
            f => f.status === 'done' && f.originFileObj
          )
          if (isAllFinished) {
            // 收集所有 done 文件的 originFileObj
            let filesToUpload = files.map(f => f.originFileObj as File)

            // 本次列表去重
            filesToUpload = deduplicateFiles(filesToUpload)

            if (!isReupload) {
              // 去掉已上传成功或失败的，因为onchange的fileList每次上传成功后不会清除列表
              const uploadedKeys = new Set(
                fileList
                  .filter(f => f.status === 'done' || f.status === 'error')
                  .map(f => f.uid)
              )
              filesToUpload = filesToUpload.filter(file => {
                const key = getFileKey(file)
                if (uploadedKeys.has(key)) {
                  console.log(`文件 ${file.name} 已在缓存，跳过上传`)
                  return false
                }
                return true
              })
            }

            if (filesToUpload.length === 0) {
              return
            }

            console.log('===== start upload to R2 ===== : ', filesToUpload)

            // return

            setUploading(true)
            const res = await batchUploadFilesWithPresigned(filesToUpload, {
              path: `m/${staticPath}`,
              concurrent: 5,
              onProgress: (fileIndex: number, progress: number) => {
                const fileUid = getFileKey(filesToUpload[fileIndex])
                setFileList(prev =>
                  prev.map(f => (f.uid === fileUid ? { ...f, progress } : f))
                )
              }
              // onComplete: (){}
            })

            setFileList(prev => {
              return prev.map(f => {
                // API 失败时只有 fileName
                const result = res.find(r => r.fileName === f.fileName)
                return result
                  ? {
                      ...f,
                      ...result,
                      status: result.success ? 'done' : 'error'
                    }
                  : f
              })
            })

            setUploading(false)
          }
        } catch (error) {
          console.error('upload error: ', error)
          setUploading(false)
          message.error('上传失败，请重试')
        }
      },
      [staticPath, fileList]
    )

    // 新 onChange 逻辑，简化分发
    const onChange = useCallback(
      async (info: any) => {
        const { status, originFileObj } = info.file
        if (status === 'uploading' && originFileObj) {
          processFilesForUI([originFileObj])
          return
        }

        if (status === 'error' && originFileObj) {
          processFilesForUI([originFileObj])
          return
        }
        if (status === 'done') {
          await handleBatchUpload(info.fileList)
        }
      },
      [processFilesForUI, handleBatchUpload]
    )

    // useEffect(() => {
    //   return () => {
    //     clearProcessedFiles()
    //   }
    // }, [])

    // 删除单个文件，并删除缓存
    const removeFileFromList = useCallback((file: File) => {
      setFileList(prev => prev.filter(f => f.uid !== getFileKey(file)))
      setProcessedFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(getFileKey(file))
        return newSet
      })
      console.log('remove file and cache: ', getFileKey(file))
    }, [])

    // 单个文件重新上传，并加入缓存
    const reuploadFileToList = useCallback(
      async (file: UploadFileResponse) => {
        handleBatchUpload(
          [
            {
              ...file,
              status: 'done',
              originFileObj: {
                uid: file.uid,
                name: file.name,
                size: file.size || 0,
                type: file.type || '',
                lastModified: file.lastModified || 0
              } as any
            }
          ],
          true
        )
      },
      [handleBatchUpload]
    )

    useImperativeHandle(ref, () => ({
      removeFileFromList,
      reuploadFileToList
    }))

    return (
      <>
        <Dragger
          className="m-ant-upload-drag"
          multiple={true}
          accept={UPLOAD_FILE_TYPE.IMAGE}
          onChange={onChange}
          showUploadList={false}
          maxCount={maxCount}
        >
          <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-[#F4F7FA80]/50 p-[3.75rem]">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 text-primary">
                {icon || <MIconFolder className="w-[3.125rem]" />}
              </div>
              <div className="text-foreground">
                <p className="font-bold">{title || 'Drag files here'}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {typesInfo}
                </p>
              </div>
              {browseFiles && (
                <div className="mt-6 flex h-11 items-center justify-center gap-2.5 rounded-lg bg-blue-600/10 px-6 py-4">
                  <div className="justify-start">
                    <span className="text-sm font-semibold text-blue-600 capitalize">
                      Browse Files
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dragger>
      </>
    )
  })
)

export default UploadMultipleFiles
