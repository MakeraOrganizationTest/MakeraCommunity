'use client'

import { useState, useCallback } from 'react'
import { Upload, message, Progress, Card } from 'antd'
import {
  LoadingOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { batchUploadFilesWithPresigned } from '@/api/client/upload'
import { getFileLink } from '@/lib/link'

const DEBOUNCE_TIME = 100
const CLEANUP_DELAY = 1500

interface ModelImageUploaderProps {
  modelId: string
  initialImages?: string[]
  onImagesChange?: (images: string[]) => void
  className?: string
  maxCount?: number
}

interface UploadingFile {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error'
  progress: number
  file: File
}

export default function ModelImageUploader({
  modelId,
  initialImages = [],
  onImagesChange,
  className,
  maxCount = 10
}: ModelImageUploaderProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages)
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
    if (now - lastTime < DEBOUNCE_TIME) return true
    ;(window as any).__lastUploadTime = now
    return false
  }

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

      const currentTotal =
        imageUrls.length + uploadingFiles.length + validFiles.length
      if (currentTotal > maxCount) {
        errors.push(`最多只能上传 ${maxCount} 张图片`)
        return []
      }

      if (errors.length > 0) {
        errors.forEach(error => message.error(error))
      }

      return validFiles
    },
    [imageUrls.length, uploadingFiles.length, maxCount]
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
      const newImageUrls = successResults
        .filter(result => result.key)
        .map(result => getFileLink(result.key))
        .filter(Boolean) as string[]

      if (newImageUrls.length > 0) {
        const updatedImages = [...imageUrls, ...newImageUrls]
        setImageUrls(updatedImages)
        onImagesChange?.(updatedImages)
        message.success(`成功上传 ${newImageUrls.length} 张图片`)
      }

      const failedCount = results.length - successResults.length
      if (failedCount > 0) {
        message.error(`${failedCount} 张图片上传失败`)
      }

      // 检查链接生成失败的情况
      const linkFailedCount =
        successResults.filter(result => result.key).length - newImageUrls.length
      if (linkFailedCount > 0) {
        message.warning(`${linkFailedCount} 张图片上传成功但链接生成失败`)
      }
    },
    [imageUrls, onImagesChange]
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
          path: `m/${modelId}/images`,
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
        setTimeout(() => setUploadingFiles([]), CLEANUP_DELAY)
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
      modelId,
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

  // 删除图片
  const handleDelete = useCallback(
    (index: number) => {
      const updatedImages = imageUrls.filter((_, i) => i !== index)
      setImageUrls(updatedImages)
      onImagesChange?.(updatedImages)
      message.success('图片已删除')
    },
    [imageUrls, onImagesChange]
  )

  // 预览图片
  const handlePreview = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  const { Dragger } = Upload
  const canUpload = imageUrls.length + uploadingFiles.length < maxCount

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
          accept="image/*"
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
            {uploading ? '正在上传中...' : '点击或拖拽图片到此区域上传'}
          </p>
          <p className="ant-upload-hint text-gray-500">
            支持单张或批量上传图片，最多可上传 {maxCount} 张
            <br />
            当前已上传: {imageUrls.length + uploadingFiles.length} 张
          </p>
        </Dragger>
      )}

      {/* 数量已满提示 */}
      {!canUpload && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            已达到最大上传数量限制 ({maxCount} 张)
          </p>
          <p className="text-sm text-gray-400">
            如需上传更多图片，请先删除部分现有图片
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
                <span className="flex-1 truncate text-sm">{file.name}</span>
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

      {/* 已上传图片列表 */}
      {imageUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            已上传图片 ({imageUrls.length}/{maxCount})
          </h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {imageUrls.map((url, index) => (
              <div key={index} className="group relative">
                <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={url}
                    alt={`模型图片 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center space-x-2 rounded-lg bg-black opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 hover:text-white"
                    onClick={() => handlePreview(url)}
                  >
                    <EyeOutlined />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-red-500/20 hover:text-white"
                    onClick={() => handleDelete(index)}
                    disabled={uploading}
                  >
                    <DeleteOutlined />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 提示信息和缓存管理 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">
          <p>• 支持拖拽或点击上传多张图片</p>
          <p>• 最多可上传 {maxCount} 张图片</p>
          <p>• 支持的格式：JPG、PNG、GIF、WebP 等</p>
          <p>• 可一次选择多张图片进行批量上传</p>
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
