import { post } from '@/lib/fetch'
import { ApiResponse } from '@/lib/server/types'

/**
 * 单个预签名 URL 响应接口
 */
export interface PresignedUrlItem {
  url: string
  key: string
  fileName: string
  expiresAt: Date
  maxFileSize: number
}

/**
 * 单个文件预签名请求接口
 */
export interface SinglePresignedUrlRequest {
  fileName?: string
  fileType?: string
  path?: string
  expiresIn?: number // 过期时间（秒），默认 3600（1小时）
  maxFileSize?: number // 最大文件大小（字节），默认 1GB
}

/**
 * 批量文件预签名请求接口
 */
export interface BatchPresignedUrlRequest {
  files: Array<{
    fileName?: string
    fileType?: string
    path?: string
    expiresIn?: number // 过期时间（秒），如果未设置则继承父级
    maxFileSize?: number // 最大文件大小（字节），如果未设置则继承父级
  }>
  expiresIn?: number // 默认过期时间（秒），默认 3600（1小时）
  maxFileSize?: number // 默认最大文件大小（字节），默认 1GB
  path?: string // 默认存储路径
}

/**
 * 生成单个预签名 URL
 * @param options 预签名 URL 配置选项
 * @returns 预签名 URL 信息
 */
export async function generatePresignedUrl(
  options: SinglePresignedUrlRequest = {}
): Promise<ApiResponse<PresignedUrlItem>> {
  return await post<PresignedUrlItem>('/client/upload/presigned', options)
}

/**
 * 批量生成预签名 URL
 * @param request 批量预签名 URL 请求配置
 * @returns 预签名 URL 列表
 */
export async function generateBatchPresignedUrls(
  request: BatchPresignedUrlRequest
): Promise<ApiResponse<PresignedUrlItem[]>> {
  return await post<PresignedUrlItem[]>('/client/upload/presigned', request)
}

/**
 * 使用预签名 URL 直接上传文件到 R2
 * @param file 要上传的文件
 * @param presignedUrl 预签名 URL 信息
 * @param onProgress 上传进度回调 (可选)
 * @returns 上传是否成功
 */
export async function uploadWithPresignedUrl(
  file: File,
  presignedUrl: PresignedUrlItem,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  // 验证文件大小
  if (file.size > presignedUrl.maxFileSize) {
    throw new Error(
      `文件大小 ${file.size} 字节超过限制 ${presignedUrl.maxFileSize} 字节`
    )
  }

  // 验证是否过期
  if (new Date() > new Date(presignedUrl.expiresAt)) {
    throw new Error('预签名 URL 已过期')
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // 设置上传进度监听
    if (onProgress) {
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })
    }

    xhr.addEventListener('load', () => {
      console.log('上传状态码:', xhr.status)
      console.log('响应头:', xhr.getAllResponseHeaders())
      console.log('响应文本:', xhr.responseText)

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true)
      } else {
        reject(
          new Error(
            `上传失败，状态码: ${xhr.status}, 响应: ${xhr.responseText}`
          )
        )
      }
    })

    xhr.addEventListener('error', event => {
      console.error('XMLHttpRequest error:', event)
      reject(new Error('上传过程中发生网络错误'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('上传被中断'))
    })

    // 发送 PUT 请求到预签名 URL
    console.log('预签名URL:', presignedUrl.url)
    console.log('文件类型:', file.type)
    console.log('文件大小:', file.size)

    xhr.open('PUT', presignedUrl.url)

    // 简化头部设置，只设置必要的 Content-Type
    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type)
    }

    xhr.send(file)
  })
}

/**
 * 批量上传文件使用预签名 URL
 * @param files 要上传的文件列表
 * @param presignedUrls 预签名 URL 列表
 * @param options 上传选项
 * @returns 上传结果列表
 */
export async function batchUploadWithPresignedUrls(
  files: File[],
  presignedUrls: PresignedUrlItem[],
  options: {
    onProgress?: (fileIndex: number, progress: number) => void
    onComplete?: (fileIndex: number, success: boolean, error?: string) => void
    concurrent?: number // 并发上传数，默认 3
  } = {}
): Promise<{ success: boolean; error?: string }[]> {
  const { onProgress, onComplete, concurrent = 3 } = options

  if (files.length !== presignedUrls.length) {
    throw new Error('文件数量与预签名 URL 数量不匹配')
  }

  const results: { success: boolean; error?: string }[] = new Array(
    files.length
  )
  let completedCount = 0
  let activeUploads = 0
  let currentIndex = 0

  return new Promise(resolve => {
    const startNextUpload = () => {
      if (currentIndex >= files.length) return

      const fileIndex = currentIndex
      const file = files[fileIndex]
      const presignedUrl = presignedUrls[fileIndex]
      currentIndex++
      activeUploads++

      uploadWithPresignedUrl(
        file,
        presignedUrl,
        onProgress ? progress => onProgress(fileIndex, progress) : undefined
      )
        .then(() => {
          results[fileIndex] = { success: true }
          if (onComplete) {
            onComplete(fileIndex, true)
          }
        })
        .catch(error => {
          results[fileIndex] = {
            success: false,
            error: error.message
          }
          if (onComplete) {
            onComplete(fileIndex, false, error.message)
          }
        })
        .finally(() => {
          activeUploads--
          completedCount++

          // 启动下一个上传
          if (currentIndex < files.length) {
            startNextUpload()
          }

          // 检查是否全部完成
          if (completedCount === files.length) {
            resolve(results)
          }
        })
    }

    // 启动初始的并发上传
    for (let i = 0; i < Math.min(concurrent, files.length); i++) {
      startNextUpload()
    }
  })
}

/**
 * 简化的预签名上传 - 自动生成预签名 URL 并上传文件
 * @param file 要上传的文件
 * @param options 上传选项
 * @returns 上传完成后的文件信息
 */
export async function uploadFileWithPresigned(
  file: File,
  options: {
    path?: string
    fileName?: string
    expiresIn?: number
    maxFileSize?: number
    onProgress?: (progress: number) => void
  } = {}
): Promise<{
  success: boolean
  key?: string
  fileName?: string
  error?: string
  size?: number
  type?: string
}> {
  try {
    // 1. 生成预签名 URL
    const presignedResponse = await generatePresignedUrl({
      fileName: options.fileName || file.name,
      fileType: file.type,
      path: options.path,
      expiresIn: options.expiresIn,
      maxFileSize: options.maxFileSize
    })

    if (!presignedResponse.success || !presignedResponse.data) {
      return {
        success: false,
        error: presignedResponse.message || '生成预签名 URL 失败'
      }
    }

    // 2. 使用预签名 URL 上传文件
    await uploadWithPresignedUrl(
      file,
      presignedResponse.data,
      options.onProgress
    )

    return {
      success: true,
      key: presignedResponse.data.key,
      fileName: presignedResponse.data.fileName,
      size: file.size,
      type: file.type
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    }
  }
}

/**
 * 简化的批量预签名上传 - 自动生成预签名 URL 并批量上传文件
 * @param files 要上传的文件列表
 * @param options 上传选项
 * @returns 批量上传结果
 */
export async function batchUploadFilesWithPresigned(
  files: File[],
  options: {
    path?: string
    expiresIn?: number
    maxFileSize?: number
    concurrent?: number
    onProgress?: (fileIndex: number, progress: number) => void
    onComplete?: (fileIndex: number, success: boolean, error?: string) => void
  } = {}
): Promise<
  {
    success: boolean
    key?: string
    fileName?: string
    error?: string
    size?: number
    type?: string
    name?: string
  }[]
> {
  try {
    // 1. 批量生成预签名 URL
    const presignedResponse = await generateBatchPresignedUrls({
      files: files.map(file => ({
        fileName: file.name,
        fileType: file.type,
        path: options.path
      })),
      expiresIn: options.expiresIn,
      maxFileSize: options.maxFileSize,
      path: options.path
    })

    if (!presignedResponse.success || !presignedResponse.data) {
      const error = presignedResponse.message || '生成预签名 URL 失败'
      return files.map(() => ({ success: false, error }))
    }

    // 2. 批量上传文件
    const uploadResults = await batchUploadWithPresignedUrls(
      files,
      presignedResponse.data,
      {
        concurrent: options.concurrent,
        onProgress: options.onProgress,
        onComplete: options.onComplete
      }
    )

    // 3. 合并结果
    return uploadResults.map((result, index) => {
      if (result.success) {
        return {
          success: true,
          key: presignedResponse.data![index].key,
          name: presignedResponse.data![index].fileName,
          size: files[index].size,
          type: files[index].type,
          lastModified: files[index].lastModified,
          fileName: files[index].name
        }
      } else {
        return {
          success: false,
          error: result.error
        }
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '批量上传失败'
    return files.map(file => ({
      success: false,
      error: errorMessage,
      size: file.size,
      type: file.type,
      name: file.name,
      fileName: file.name,
      lastModified: file.lastModified
    }))
  }
}

/**
 * 预签名上传头像 - 便捷方法
 * @param file 头像文件
 * @param options 上传选项
 * @returns 上传结果
 */
export async function uploadAvatarWithPresigned(
  file: File,
  options: {
    fileName?: string
    onProgress?: (progress: number) => void
  } = {}
): Promise<{
  success: boolean
  key?: string
  fileName?: string
  error?: string
}> {
  return uploadFileWithPresigned(file, {
    path: 'u',
    fileName: options.fileName,
    maxFileSize: 5 * 1024 * 1024, // 5MB 限制
    onProgress: options.onProgress
  })
}

/**
 * 预签名上传模型图片 - 便捷方法
 * @param file 模型图片文件
 * @param modelId 模型ID
 * @param options 上传选项
 * @returns 上传结果
 */
export async function uploadModelImageWithPresigned(
  file: File,
  modelId: string,
  options: {
    fileName?: string
    onProgress?: (progress: number) => void
  } = {}
): Promise<{
  success: boolean
  key?: string
  fileName?: string
  error?: string
}> {
  return uploadFileWithPresigned(file, {
    path: `m/${modelId}/images`,
    fileName: options.fileName,
    maxFileSize: 10 * 1024 * 1024, // 10MB 限制
    onProgress: options.onProgress
  })
}
