'use client'

import { useState, useCallback } from 'react'
import { Upload, message, Progress, Card } from 'antd'
import {
  LoadingOutlined,
  DeleteOutlined,
  DownloadOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { batchUploadFilesWithPresigned } from '@/api/client/upload'

const UPLOAD_BASE_URL = 'https://pub-c6657a8ca5ae479391474fda6501e587.r2.dev'

interface FileUploaderProps {
  uploadPath: string
  initialFiles?: string[]
  onFilesChange?: (files: string[]) => void
  className?: string
  maxCount?: number
  maxSize?: number // 单个文件最大大小，单位MB
  allowedTypes?: string[] // 允许的文件类型，如 ['image/*', 'application/pdf']
  title?: string
  description?: string
}

interface UploadingFile {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error'
  progress: number
  file: File
}

// 获取文件大小的格式化字符串
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// 获取文件图标
const getFileIcon = (filename: string) => {
  const ext = getFileExtension(filename)
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

  if (imageExts.includes(ext)) {
    return '🖼️'
  }

  const iconMap: { [key: string]: string } = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📈',
    pptx: '📈',
    txt: '📃',
    zip: '📦',
    rar: '📦',
    mp4: '🎥',
    avi: '🎥',
    mp3: '🎵',
    wav: '🎵'
  }

  return iconMap[ext] || '📄'
}

export default function FileUploader({
  uploadPath,
  initialFiles = [],
  onFilesChange,
  className,
  maxCount = 10,
  maxSize = 50, // 默认50MB
  allowedTypes = [], // 空数组表示允许所有类型
  title = '文件上传',
  description = '支持拖拽或点击上传文件'
}: FileUploaderProps) {
  const [fileUrls, setFileUrls] = useState<string[]>(initialFiles)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set())

  // 生成文件唯一标识
  const getFileKey = (file: File) =>
    `${file.name}_${file.size}_${file.lastModified}`

  // 防抖检查
  const shouldDebounce = () => {
    const now = Date.now()
    const lastTime = (window as any).__lastUploadTime || 0
    if (now - lastTime < 100) return true
    ;(window as any).__lastUploadTime = now
    return false
  }

  // 文件验证
  const validateFiles = useCallback(
    (files: File[]) => {
      const errors: string[] = []
      const maxSizeInBytes = maxSize * 1024 * 1024

      const validFiles = files.filter(file => {
        // 检查文件类型
        if (allowedTypes.length > 0) {
          const isAllowed = allowedTypes.some(type => {
            if (type.includes('*')) {
              // 处理通配符类型，如 'image/*'
              const prefix = type.split('/')[0]
              return file.type.startsWith(prefix + '/')
            }
            return file.type === type
          })

          if (!isAllowed) {
            errors.push(`${file.name} 文件类型不支持`)
            return false
          }
        }

        // 检查文件大小
        if (file.size > maxSizeInBytes) {
          errors.push(
            `${file.name} 文件大小超过限制 (${formatFileSize(maxSizeInBytes)})`
          )
          return false
        }

        return true
      })

      const currentTotal =
        fileUrls.length + uploadingFiles.length + validFiles.length
      if (currentTotal > maxCount) {
        errors.push(`最多只能上传 ${maxCount} 个文件`)
        return []
      }

      if (errors.length > 0) {
        errors.forEach(error => message.error(error))
      }

      return validFiles
    },
    [fileUrls.length, uploadingFiles.length, maxCount, maxSize, allowedTypes]
  )

  // 过滤未处理的文件
  const filterUnprocessedFiles = useCallback(
    (files: File[]) => {
      return files.filter(file => {
        const fileKey = getFileKey(file)
        if (processedFiles.has(fileKey)) {
          console.log(`文件 ${file.name} 已处理，跳过`)
          return false
        }
        return true
      })
    },
    [processedFiles]
  )

  // 标记文件为已处理
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
    message.success('已清理文件缓存')
  }, [])

  // 创建上传文件对象
  const createUploadingFiles = useCallback((files: File[]): UploadingFile[] => {
    return files.map(file => ({
      uid: `${file.name}_${Date.now()}_${Math.random()}`,
      name: file.name,
      status: 'uploading' as const,
      progress: 0,
      file
    }))
  }, [])

  // 处理上传结果
  const handleUploadResults = useCallback(
    (results: any[]) => {
      const successResults = results.filter(result => result.success)
      const newFileUrls = successResults
        .filter(result => result.key)
        .map(result => `${UPLOAD_BASE_URL}/${result.key}`)

      if (newFileUrls.length > 0) {
        const updatedFiles = [...fileUrls, ...newFileUrls]
        setFileUrls(updatedFiles)
        onFilesChange?.(updatedFiles)
        message.success(`成功上传 ${newFileUrls.length} 个文件`)
      }

      const failedCount = results.length - successResults.length
      if (failedCount > 0) {
        message.error(`${failedCount} 个文件上传失败`)
      }
    },
    [fileUrls, onFilesChange]
  )

  // 统一的文件处理函数
  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || uploading) return

      const unprocessedFiles = filterUnprocessedFiles(files)
      if (unprocessedFiles.length === 0) return

      const validFiles = validateFiles(unprocessedFiles)
      if (validFiles.length === 0) return

      markFilesAsProcessed(validFiles)
      setUploading(true)

      const uploadingFileObjects = createUploadingFiles(validFiles)
      setUploadingFiles(prev => [...prev, ...uploadingFileObjects])

      try {
        const results = await batchUploadFilesWithPresigned(validFiles, {
          path: uploadPath,
          concurrent: 3,
          onProgress: (fileIndex: number, progress: number) => {
            const fileUid = uploadingFileObjects[fileIndex]?.uid
            if (fileUid) {
              setUploadingFiles(prev =>
                prev.map(f => (f.uid === fileUid ? { ...f, progress } : f))
              )
            }
          },
          onComplete: (fileIndex: number, success: boolean, error?: string) => {
            const fileUid = uploadingFileObjects[fileIndex]?.uid
            if (fileUid) {
              setUploadingFiles(prev =>
                prev.map(f =>
                  f.uid === fileUid
                    ? {
                        ...f,
                        status: success ? 'done' : 'error',
                        progress: success ? 100 : f.progress
                      }
                    : f
                )
              )
              if (!success && error) {
                message.error(
                  `${uploadingFileObjects[fileIndex]?.name} 上传失败: ${error}`
                )
              }
            }
          }
        })

        handleUploadResults(results)

        // 延迟清理上传状态
        setTimeout(() => setUploadingFiles([]), 1500)
      } catch (error) {
        console.error('上传失败:', error)
        message.error('上传失败，请重试')
        setUploadingFiles([])

        // 上传失败时清理标记，允许重新上传
        const newProcessedFiles = new Set(processedFiles)
        validFiles.forEach(file => newProcessedFiles.delete(getFileKey(file)))
        setProcessedFiles(newProcessedFiles)
      } finally {
        setUploading(false)
      }
    },
    [
      uploading,
      filterUnprocessedFiles,
      validateFiles,
      markFilesAsProcessed,
      createUploadingFiles,
      handleUploadResults,
      uploadPath,
      processedFiles
    ]
  )

  // 处理文件选择
  const handleChange = useCallback(
    async (info: any) => {
      if (shouldDebounce()) return

      const newFiles =
        info.fileList
          ?.filter((file: any) => !file.status && file.originFileObj)
          ?.map((file: any) => file.originFileObj as File) || []

      if (newFiles.length > 0) {
        await processFiles(newFiles)
      }
    },
    [processFiles]
  )

  // 删除文件
  const handleDelete = useCallback(
    (index: number) => {
      const updatedFiles = fileUrls.filter((_, i) => i !== index)
      setFileUrls(updatedFiles)
      onFilesChange?.(updatedFiles)
      message.success('文件已删除')
    },
    [fileUrls, onFilesChange]
  )

  // 下载文件
  const handleDownload = useCallback((url: string, filename?: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'file'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // 从URL提取文件名
  const getFilenameFromUrl = useCallback((url: string) => {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1])
  }, [])

  const { Dragger } = Upload
  const canUpload = fileUrls.length + uploadingFiles.length < maxCount

  return (
    <div className={cn('space-y-4', className)}>
      {/* 拖拽上传区域 */}
      {canUpload && (
        <Dragger
          multiple
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleChange}
          disabled={uploading}
          accept={allowedTypes.length > 0 ? allowedTypes.join(',') : undefined}
          className="bg-gray-50 hover:bg-gray-100"
          fileList={[]}
        >
          <p className="ant-upload-drag-icon">
            {uploading ? (
              <LoadingOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            ) : (
              <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            )}
          </p>
          <p className="ant-upload-text text-lg font-medium text-gray-700">
            {uploading ? '正在上传中...' : description}
          </p>
          <p className="ant-upload-hint text-gray-500">
            支持单个或批量上传文件，最多可上传 {maxCount} 个
            <br />
            单个文件最大 {formatFileSize(maxSize * 1024 * 1024)}
            <br />
            当前已上传: {fileUrls.length + uploadingFiles.length} 个
            {allowedTypes.length > 0 && (
              <>
                <br />
                支持的文件类型: {allowedTypes.join(', ')}
              </>
            )}
          </p>
        </Dragger>
      )}

      {/* 数量已满提示 */}
      {!canUpload && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            已达到最大上传数量限制 ({maxCount} 个)
          </p>
          <p className="text-sm text-gray-400">
            如需上传更多文件，请先删除部分现有文件
          </p>
        </div>
      )}

      {/* 上传进度显示 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">上传进度</h4>
          {uploadingFiles.map(file => (
            <Card key={file.uid} size="small" className="p-2">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <span className="text-lg">{getFileIcon(file.name)}</span>
                  <span className="flex-1 truncate text-sm">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatFileSize(file.file.size)}
                  </span>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  {file.status === 'uploading' && `${file.progress}%`}
                  {file.status === 'done' && '✅ 完成'}
                  {file.status === 'error' && '❌ 失败'}
                </span>
              </div>
              <Progress
                percent={file.progress}
                status={
                  file.status === 'error'
                    ? 'exception'
                    : file.status === 'done'
                      ? 'success'
                      : 'active'
                }
                showInfo={false}
                size="small"
              />
            </Card>
          ))}
        </div>
      )}

      {/* 已上传文件列表 */}
      {fileUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            已上传文件 ({fileUrls.length}/{maxCount})
          </h4>
          <div className="space-y-2">
            {fileUrls.map((url, index) => {
              const filename = getFilenameFromUrl(url)
              return (
                <Card key={index} size="small" className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center space-x-3">
                      <span className="flex-shrink-0 text-lg">
                        {getFileIcon(filename)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {filename}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => handleDownload(url, filename)}
                      >
                        <DownloadOutlined />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(index)}
                        disabled={uploading}
                      >
                        <DeleteOutlined />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 提示信息和缓存管理 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          <p>• 支持拖拽或点击上传多个文件</p>
          <p>• 最多可上传 {maxCount} 个文件</p>
          <p>• 单个文件最大 {formatFileSize(maxSize * 1024 * 1024)}</p>
          {allowedTypes.length > 0 && (
            <p>• 支持的文件类型：{allowedTypes.join(', ')}</p>
          )}
          <p>• 可一次选择多个文件进行批量上传</p>
        </div>

        {processedFiles.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-sm text-blue-700">
              已缓存 {processedFiles.size} 个文件，相同文件不会重复上传
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={clearProcessedFiles}
              className="border-blue-300 text-blue-600 hover:bg-blue-100"
            >
              清理缓存
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
