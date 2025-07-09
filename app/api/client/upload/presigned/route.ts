import { NextRequest } from 'next/server'
import { withAuthenticatedApiHandler } from '@/lib/server/middlewares/composer'
import { createSuccessResponse, createErrorResponse } from '@/lib/server'
import { COMMON_ERROR } from '@/constants/error-codes'
import { v4 as uuid } from 'uuid'
import { AwsClient } from 'aws4fetch'
import type { AuthenticatedApiHandler } from '@/lib/server/types'
import type { User } from '@/types/user'

// 配置常量
const CONFIG = {
  MAX_BATCH_SIZE: 50,
  DEFAULT_EXPIRES_IN: 3600, // 1 小时
  MIN_EXPIRES_IN: 1, // 1 秒
  MAX_EXPIRES_IN: 604800, // 7 天
  MAX_FILENAME_LENGTH: 100,
  MAX_PATH_DEPTH: 10,
  MAX_FILE_SIZE: 1024 * 1024 * 1024, // 1GB
  // R2 环境变量配置
  R2: {
    ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    ENDPOINT_URL: process.env.R2_ENDPOINT_URL,
    BUCKET_NAME: process.env.R2_BUCKET_NAME
  }
} as const

// 单个文件预签名请求接口
interface SinglePresignedUrlRequest {
  fileName?: string
  fileType?: string
  path?: string
  expiresIn?: number // 过期时间（秒），默认 3600（1小时）
  maxFileSize?: number // 最大文件大小（字节），默认 1GB
}

// 批量文件预签名请求接口
interface BatchPresignedUrlRequest {
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

// 预签名 URL 请求参数接口（联合类型）
type PresignedUrlRequest = SinglePresignedUrlRequest | BatchPresignedUrlRequest

// 单个预签名 URL 响应接口
interface PresignedUrlItem {
  url: string
  key: string
  fileName: string
  expiresAt: Date
  maxFileSize: number // 最大允许文件大小（字节）
}

// AWS 客户端缓存
let cachedAwsClient: AwsClient | null = null

/**
 * 创建或获取缓存的 AWS 客户端实例
 */
function getAwsClient(): AwsClient {
  if (cachedAwsClient) {
    return cachedAwsClient
  }

  const accessKeyId = CONFIG.R2.ACCESS_KEY_ID
  const secretAccessKey = CONFIG.R2.SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured')
  }

  cachedAwsClient = new AwsClient({
    accessKeyId,
    secretAccessKey
  })

  return cachedAwsClient
}

/**
 * 验证 R2 配置
 */
function validateR2Config(): void {
  const requiredEnvVars = {
    R2_ACCESS_KEY_ID: CONFIG.R2.ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: CONFIG.R2.SECRET_ACCESS_KEY,
    R2_ENDPOINT_URL: CONFIG.R2.ENDPOINT_URL,
    R2_BUCKET_NAME: CONFIG.R2.BUCKET_NAME
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }
}

/**
 * 获取安全的文件路径
 */
function getSafePath(customPath?: string): string {
  if (!customPath) {
    // 返回默认路径: uploads/年/月
    return `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}`
  }

  // 移除路径中的非法字符和序列
  let safePath = customPath
    .replace(/\.\./g, '') // 防止目录遍历
    .replace(/[^\w\-\/]/g, '') // 只允许字母数字、连字符和斜杠
    .replace(/^\/+|\/+$/g, '') // 移除开头和结尾的斜杠

  // 如果清理后路径为空，则使用默认路径
  if (!safePath) {
    return `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}`
  }

  // 验证路径深度（防止过深的目录结构）
  const pathSegments = safePath.split('/').filter(segment => segment.length > 0)
  if (pathSegments.length > CONFIG.MAX_PATH_DEPTH) {
    // 如果路径过深，只取前几层
    safePath = pathSegments.slice(0, CONFIG.MAX_PATH_DEPTH).join('/')
  }

  return safePath
}

// 允许的文件类型
const ALLOWED_MIME_TYPES = new Set([
  // 图片
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // 文档
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 视频
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  // 音频
  'audio/mpeg',
  'audio/wav',
  'audio/mp3',
  'audio/webm',
  // 压缩文件
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // 其他
  'application/json',
  'application/xml'
])

/**
 * 验证文件类型
 */
function validateFileType(fileType?: string): boolean {
  if (!fileType) return true // 允许不指定类型
  return ALLOWED_MIME_TYPES.has(fileType.toLowerCase())
}

/**
 * 获取文件扩展名
 */
function getFileExtension(fileType?: string, fileName?: string): string {
  // 优先从 MIME 类型推断
  if (fileType) {
    const mimeExt = fileType.split('/')[1]
    // 处理一些特殊情况
    const extMap: Record<string, string> = {
      jpeg: 'jpg',
      'svg+xml': 'svg',
      'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'vnd.ms-excel': 'xls',
      'vnd.ms-powerpoint': 'ppt',
      msword: 'doc',
      'x-rar-compressed': 'rar',
      'x-7z-compressed': '7z'
    }
    return extMap[mimeExt] || mimeExt
  }

  // 从文件名推断
  if (fileName) {
    const match = fileName.match(/\.([^.]+)$/)
    if (match) return match[1].toLowerCase()
  }

  return 'bin'
}

/**
 * 获取安全的文件名
 */
function getSafeFileName(originalFileName?: string, fileType?: string): string {
  const timestamp = Date.now().toString(36)
  const fileExt = getFileExtension(fileType, originalFileName)

  if (originalFileName && originalFileName.trim() !== '') {
    // 清理文件名中的非法字符
    const safeName = originalFileName
      .trim()
      .replace(/\.[^/.]+$/, '') // 移除可能存在的扩展名
      .replace(/[^\w\-\u4e00-\u9fa5]/g, '_') // 替换非字母数字字符为下划线，保留中文
      .substring(0, CONFIG.MAX_FILENAME_LENGTH) // 限制长度

    return `${safeName}-${timestamp}.${fileExt}`
  }

  // 默认使用短 UUID + 时间戳
  return `${uuid().substring(0, 8)}-${timestamp}.${fileExt}`
}

/**
 * 生成单个预签名 URL
 */
async function generateSinglePresignedUrl(
  client: AwsClient,
  endpointUrl: string,
  fileName?: string,
  fileType?: string,
  path?: string,
  expiresIn: number = 3600,
  maxFileSize?: number
): Promise<PresignedUrlItem> {
  // 验证文件类型
  if (fileType && !validateFileType(fileType)) {
    throw new Error(`Unsupported file type: ${fileType}`)
  }

  // 验证文件大小限制
  const fileSizeLimit = Math.min(
    maxFileSize || CONFIG.MAX_FILE_SIZE,
    CONFIG.MAX_FILE_SIZE
  )
  if (fileSizeLimit <= 0) {
    throw new Error('Invalid file size limit')
  }

  // 构建文件路径和名称
  const safePath = getSafePath(path)
  const safeFileName = getSafeFileName(fileName, fileType)
  const key = `${safePath}/${safeFileName}`

  // 获取bucket名称
  const bucketName = CONFIG.R2.BUCKET_NAME!

  // 构建 R2 URL
  const url = new URL(endpointUrl)
  // 如果endpointUrl不包含bucket名称，则添加它
  if (!url.pathname.includes(bucketName)) {
    url.pathname = `/${bucketName}/${key}`
  } else {
    url.pathname = `/${key}`
  }
  url.searchParams.set('X-Amz-Expires', expiresIn.toString())

  console.log('生成预签名URL调试信息:')
  console.log('- endpointUrl:', endpointUrl)
  console.log('- bucketName:', bucketName)
  console.log('- key:', key)
  console.log('- fileType:', fileType)
  console.log('- 构建的URL:', url.toString())

  // 准备请求头部 - 必须与客户端发送的头部完全匹配
  const headers: Record<string, string> = {}

  // 如果指定了文件类型，添加 Content-Type
  if (fileType) {
    headers['Content-Type'] = fileType
  }

  // 创建请求对象，包含必要的头部信息
  const request = new Request(url, {
    method: 'PUT',
    headers: headers
  })

  // 生成预签名 URL
  const signed = await client.sign(request, {
    aws: {
      signQuery: true,
      service: 's3',
      region: 'auto' // R2 使用 'auto' 作为区域
    }
  })

  console.log('签名后的URL:', signed.url)
  console.log('原始请求头:', Object.fromEntries(request.headers.entries()))

  // 计算过期时间
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  return {
    url: signed.url,
    key,
    fileName: safeFileName,
    expiresAt,
    maxFileSize: fileSizeLimit
  }
}

/**
 * @swagger
 * /api/client/upload/presigned:
 *   post:
 *     tags:
 *       - Upload
 *     summary: 生成 R2 预签名上传 URL
 *     description: |
 *       生成用于直接上传文件到 Cloudflare R2 的预签名 URL。
 *       客户端可以使用返回的 URL 直接向 R2 上传文件，无需通过服务器中转，提升上传性能并减少服务器负载。
 *       **注意：此接口需要用户认证，只有登录用户才能生成预签名URL。认证通过Cookie进行。**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - title: 单个文件预签名
 *                 type: object
 *                 properties:
 *                   fileName:
 *                     type: string
 *                     description: 自定义文件名（可选）
 *                     example: "avatar.jpg"
 *                   fileType:
 *                     type: string
 *                     description: 文件 MIME 类型（可选）
 *                     example: "image/jpeg"
 *                   path:
 *                     type: string
 *                     description: 自定义存储路径（可选）
 *                     example: "user-uploads"
 *                   expiresIn:
 *                     type: integer
 *                     description: URL 过期时间（秒），默认 3600（1小时），最大 604800（7天）
 *                     minimum: 1
 *                     maximum: 604800
 *                     default: 3600
 *                     example: 3600
 *                   maxFileSize:
 *                     type: integer
 *                     description: 最大文件大小（字节），默认 1GB，最大 1GB
 *                     minimum: 1
 *                     maximum: 1073741824
 *                     default: 1073741824
 *                     example: 104857600
 *               - title: 批量文件预签名
 *                 type: object
 *                 required: ["files"]
 *                 properties:
 *                   files:
 *                     type: array
 *                     description: 要生成预签名 URL 的文件列表（最多50个）
 *                     minItems: 1
 *                     maxItems: 50
 *                     items:
 *                       type: object
 *                       properties:
 *                         fileName:
 *                           type: string
 *                           description: 自定义文件名（可选）
 *                           example: "document.pdf"
 *                         fileType:
 *                           type: string
 *                           description: 文件 MIME 类型（可选）
 *                           example: "application/pdf"
 *                         path:
 *                           type: string
 *                           description: 自定义存储路径（可选）
 *                           example: "documents"
 *                         expiresIn:
 *                           type: integer
 *                           description: 过期时间（秒），如果未设置则继承父级
 *                           minimum: 1
 *                           maximum: 604800
 *                           example: 7200
 *                         maxFileSize:
 *                           type: integer
 *                           description: 最大文件大小（字节），如果未设置则继承父级
 *                           minimum: 1
 *                           maximum: 1073741824
 *                           example: 104857600
 *                   expiresIn:
 *                     type: integer
 *                     description: 默认过期时间（秒），当文件项中未指定时使用，默认 3600（1小时）
 *                     minimum: 1
 *                     maximum: 604800
 *                     default: 3600
 *                     example: 3600
 *                   maxFileSize:
 *                     type: integer
 *                     description: 默认最大文件大小（字节），当文件项中未指定时使用，默认 1GB
 *                     minimum: 1
 *                     maximum: 1073741824
 *                     default: 1073741824
 *                     example: 536870912
 *                   path:
 *                     type: string
 *                     description: 默认存储路径，当文件项中未指定时使用
 *                     example: "uploads"
 *           examples:
 *             single_basic:
 *               summary: 单个文件 - 基本上传
 *               value:
 *                 fileName: "document.pdf"
 *                 fileType: "application/pdf"
 *             single_custom_path:
 *               summary: 单个文件 - 自定义路径和大小限制
 *               value:
 *                 fileName: "profile-picture.jpg"
 *                 fileType: "image/jpeg"
 *                 path: "avatars"
 *                 expiresIn: 7200
 *                 maxFileSize: 10485760
 *             batch_mixed:
 *               summary: 批量文件 - 配置继承示例
 *               value:
 *                 files:
 *                   - fileName: "avatar.jpg"
 *                     fileType: "image/jpeg"
 *                     path: "avatars"
 *                     maxFileSize: 5242880
 *                   - fileName: "document.pdf"
 *                     fileType: "application/pdf"
 *                     expiresIn: 7200
 *                   - fileType: "video/mp4"
 *                     maxFileSize: 209715200
 *                 expiresIn: 3600
 *                 maxFileSize: 104857600
 *                 path: "uploads"
 *             batch_simple:
 *               summary: 批量文件 - 简单上传
 *               value:
 *                 files:
 *                   - {}
 *                   - {}
 *                   - {}
 *                 expiresIn: 1800
 *     responses:
 *       200:
 *         description: 预签名 URL 生成成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Presigned URL generated successfully"
 *                 data:
 *                   oneOf:
 *                     - title: 单个文件响应
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           description: 预签名上传 URL
 *                           example: "https://bucket.accountid.r2.cloudflarestorage.com/uploads/2024/1/document-abc123.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&..."
 *                         key:
 *                           type: string
 *                           description: 文件在 R2 中的完整路径
 *                           example: "uploads/2024/1/document-abc123.pdf"
 *                         fileName:
 *                           type: string
 *                           description: 最终生成的文件名
 *                           example: "document-abc123.pdf"
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                           description: URL 过期时间
 *                           example: "2024-01-15T10:30:00.000Z"
 *                         maxFileSize:
 *                           type: integer
 *                           description: 最大允许文件大小（字节）
 *                           example: 1073741824
 *                     - title: 批量文件响应
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                             description: 预签名上传 URL
 *                           key:
 *                             type: string
 *                             description: 文件在 R2 中的完整路径
 *                           fileName:
 *                             type: string
 *                             description: 最终生成的文件名
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                             description: URL 过期时间
 *                           maxFileSize:
 *                             type: integer
 *                             description: 最大允许文件大小（字节）
 *             examples:
 *               single_success:
 *                 summary: 单个文件成功响应
 *                 value:
 *                   success: true
 *                   message: "Presigned URL generated successfully"
 *                   data:
 *                     url: "https://bucket.accountid.r2.cloudflarestorage.com/uploads/2024/1/document-k2j9x1a2.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
 *                     key: "uploads/2024/1/document-k2j9x1a2.pdf"
 *                     fileName: "document-k2j9x1a2.pdf"
 *                     expiresAt: "2024-01-15T10:30:00.000Z"
 *                     maxFileSize: 1073741824
 *               batch_success:
 *                 summary: 批量文件成功响应
 *                 value:
 *                   success: true
 *                   message: "3 presigned URLs generated successfully"
 *                   data:
 *                     - url: "https://bucket.accountid.r2.cloudflarestorage.com/avatars/avatar-k2j9x1a2.jpg?X-Amz-Algorithm=..."
 *                       key: "avatars/avatar-k2j9x1a2.jpg"
 *                       fileName: "avatar-k2j9x1a2.jpg"
 *                       expiresAt: "2024-01-15T10:30:00.000Z"
 *                       maxFileSize: 1073741824
 *                     - url: "https://bucket.accountid.r2.cloudflarestorage.com/documents/document-m3k8y5b1.pdf?X-Amz-Algorithm=..."
 *                       key: "documents/document-m3k8y5b1.pdf"
 *                       fileName: "document-m3k8y5b1.pdf"
 *                       expiresAt: "2024-01-15T10:30:00.000Z"
 *                       maxFileSize: 1073741824
 *                     - url: "https://bucket.accountid.r2.cloudflarestorage.com/videos/x7z4w2n9-abc123.mp4?X-Amz-Algorithm=..."
 *                       key: "videos/x7z4w2n9-abc123.mp4"
 *                       fileName: "x7z4w2n9-abc123.mp4"
 *                       expiresAt: "2024-01-15T10:30:00.000Z"
 *                       maxFileSize: 1073741824
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "expiresIn must be a valid number"
 *                 code:
 *                   type: string
 *                   example: "PARAM_ERROR"
 *       401:
 *         description: 认证失败，用户未登录或Cookie认证无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authentication required. Please log in to access this resource."
 *                 code:
 *                   type: string
 *                   example: "AUTH_ERROR"
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "R2 configuration incomplete"
 *                 code:
 *                   type: string
 *                   example: "SYSTEM_ERROR"
 *     x-code-examples:
 *       - lang: 'JavaScript'
 *         label: '单个文件上传示例'
 *         source: |
 *           // 1. 获取单个预签名 URL（认证通过Cookie自动处理）
 *           const response = await fetch('/api/client/upload/presigned', {
 *             method: 'POST',
 *             headers: {
 *               'Content-Type': 'application/json'
 *             },
 *             credentials: 'include', // 包含Cookie进行认证
 *             body: JSON.stringify({
 *               fileName: file.name,
 *               fileType: file.type,
 *               path: 'uploads',
 *               maxFileSize: 100 * 1024 * 1024 // 100MB
 *             })
 *           });
 *
 *           const { data } = await response.json();
 *
 *           // 2. 验证文件大小并上传
 *           if (file.size > data.maxFileSize) {
 *             throw new Error(`文件太大，最大允许 ${data.maxFileSize} 字节`);
 *           }
 *
 *           const uploadResponse = await fetch(data.url, {
 *             method: 'PUT',
 *             body: file,
 *             headers: { 'Content-Type': file.type }
 *           });
 *
 *           if (uploadResponse.ok) {
 *             console.log('上传成功!', data.key);
 *           }
 *       - lang: 'JavaScript'
 *         label: '批量文件上传示例（配置继承）'
 *         source: |
 *           // 1. 批量获取预签名 URL（展示配置继承机制，认证通过Cookie自动处理）
 *           const files = [avatarFile, documentFile, videoFile];
 *           const response = await fetch('/api/client/upload/presigned', {
 *             method: 'POST',
 *             headers: {
 *               'Content-Type': 'application/json'
 *             },
 *             credentials: 'include', // 包含Cookie进行认证
 *             body: JSON.stringify({
 *               files: [
 *                 {
 *                   fileName: avatarFile.name,
 *                   fileType: avatarFile.type,
 *                   path: 'avatars',
 *                   maxFileSize: 5 * 1024 * 1024 // 5MB，覆盖默认
 *                 },
 *                 {
 *                   fileName: documentFile.name,
 *                   fileType: documentFile.type,
 *                   expiresIn: 7200, // 2小时，覆盖默认
 *                   // path 和 maxFileSize 将继承父级配置
 *                 },
 *                 {
 *                   fileType: videoFile.type,
 *                   // 所有配置都继承父级
 *                 }
 *               ],
 *               expiresIn: 3600, // 默认过期时间 1小时
 *               maxFileSize: 100 * 1024 * 1024, // 默认最大 100MB
 *               path: 'uploads' // 默认路径
 *             })
 *           });
 *
 *           const { data: presignedUrls } = await response.json();
 *
 *           // 2. 验证并并行上传所有文件
 *           const uploadPromises = files.map(async (file, index) => {
 *             const presignedData = presignedUrls[index];
 *
 *             // 验证文件大小
 *             if (file.size > presignedData.maxFileSize) {
 *               throw new Error(`文件 ${file.name} 太大，最大允许 ${presignedData.maxFileSize} 字节`);
 *             }
 *
 *             const uploadResponse = await fetch(presignedData.url, {
 *               method: 'PUT',
 *               body: file,
 *               headers: { 'Content-Type': file.type }
 *             });
 *
 *             return {
 *               success: uploadResponse.ok,
 *               key: presignedData.key,
 *               fileName: presignedData.fileName,
 *               maxFileSize: presignedData.maxFileSize
 *             };
 *           });
 *
 *           const results = await Promise.all(uploadPromises);
 *           console.log('批量上传结果:', results);
 *       - lang: 'cURL'
 *         label: '单个文件 cURL 示例'
 *         source: |
 *           # 1. 获取单个预签名 URL（需要先登录获取Cookie）
 *           curl -X POST https://your-domain.com/api/client/upload/presigned \
 *             -H "Content-Type: application/json" \
 *             -c cookies.txt -b cookies.txt \
 *             -d '{
 *               "fileName": "example.jpg",
 *               "fileType": "image/jpeg",
 *               "path": "uploads"
 *             }'
 *
 *           # 2. 使用返回的 URL 上传文件
 *           curl -X PUT "返回的预签名URL" \
 *             -H "Content-Type: image/jpeg" \
 *             --data-binary @example.jpg
 *       - lang: 'cURL'
 *         label: '批量文件 cURL 示例'
 *         source: |
 *           # 1. 批量获取预签名 URL（配置继承示例，需要先登录获取Cookie）
 *           curl -X POST https://your-domain.com/api/client/upload/presigned \
 *             -H "Content-Type: application/json" \
 *             -c cookies.txt -b cookies.txt \
 *             -d '{
 *               "files": [
 *                 {
 *                   "fileName": "avatar.jpg",
 *                   "fileType": "image/jpeg",
 *                   "path": "avatars",
 *                   "maxFileSize": 5242880
 *                 },
 *                 {
 *                   "fileName": "document.pdf",
 *                   "fileType": "application/pdf",
 *                   "expiresIn": 7200
 *                 },
 *                 {
 *                   "fileType": "video/mp4",
 *                   "maxFileSize": 209715200
 *                 }
 *               ],
 *               "expiresIn": 3600,
 *               "maxFileSize": 104857600,
 *               "path": "uploads"
 *             }'
 *
 *           # 2. 分别使用返回的 URL 上传文件
 *           curl -X PUT "第一个预签名URL" \
 *             -H "Content-Type: image/jpeg" \
 *             --data-binary @avatar.jpg
 *
 *           curl -X PUT "第二个预签名URL" \
 *             -H "Content-Type: application/pdf" \
 *             --data-binary @document.pdf
 *
 *           curl -X PUT "第三个预签名URL" \
 *             -H "Content-Type: video/mp4" \
 *             --data-binary @video.mp4
 */
const generatePresignedUrlHandler: AuthenticatedApiHandler = async (
  req: NextRequest,
  user: User
) => {
  try {
    // 验证 R2 配置
    validateR2Config()

    // 记录用户访问日志
    console.log(
      `生成预签名URL请求 - 用户ID: ${user.id}, 用户邮箱: ${user.email}`
    )

    const endpointUrl = CONFIG.R2.ENDPOINT_URL!

    // 解析请求参数
    let body: PresignedUrlRequest
    try {
      body = await req.json()
    } catch (error) {
      return createErrorResponse(
        COMMON_ERROR.PARAM_ERROR,
        'Invalid JSON in request body',
        null,
        400
      )
    }

    // 判断是批量请求还是单个请求
    const isBatchRequest = 'files' in body

    // 删除之前的全局验证，改为在具体处理时验证

    // 获取 AWS 客户端
    const client = getAwsClient()

    if (isBatchRequest) {
      // 批量处理
      const batchBody = body as BatchPresignedUrlRequest

      // 验证批量请求参数
      if (!Array.isArray(batchBody.files) || batchBody.files.length === 0) {
        return createErrorResponse(
          COMMON_ERROR.PARAM_ERROR,
          'files array is required and cannot be empty',
          null,
          400
        )
      }

      // 限制批量数量
      if (batchBody.files.length > CONFIG.MAX_BATCH_SIZE) {
        return createErrorResponse(
          COMMON_ERROR.PARAM_ERROR,
          `Maximum ${CONFIG.MAX_BATCH_SIZE} files allowed per batch request`,
          null,
          400
        )
      }

      // 批量生成预签名 URL（并行处理，带错误处理）
      const results = await Promise.allSettled(
        batchBody.files.map(fileItem => {
          // 实现继承机制：文件项配置 > 父级配置 > 默认配置
          const fileExpiresIn = Math.max(
            CONFIG.MIN_EXPIRES_IN,
            Math.min(
              fileItem.expiresIn ||
                batchBody.expiresIn ||
                CONFIG.DEFAULT_EXPIRES_IN,
              CONFIG.MAX_EXPIRES_IN
            )
          )

          const filePath = fileItem.path || batchBody.path
          const fileMaxFileSize = fileItem.maxFileSize || batchBody.maxFileSize

          return generateSinglePresignedUrl(
            client,
            endpointUrl,
            fileItem.fileName,
            fileItem.fileType,
            filePath,
            fileExpiresIn,
            fileMaxFileSize
          )
        })
      )

      // 检查是否有失败的生成
      const failedItems = results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result.status === 'rejected')

      if (failedItems.length > 0) {
        const firstError = (failedItems[0].result as PromiseRejectedResult)
          .reason
        return createErrorResponse(
          COMMON_ERROR.PARAM_ERROR,
          `Failed to generate presigned URL for file ${failedItems[0].index + 1}: ${firstError.message}`,
          null,
          400
        )
      }

      // 提取成功的结果
      const successResults = results.map(
        result => (result as PromiseFulfilledResult<PresignedUrlItem>).value
      )

      const response = createSuccessResponse(
        successResults,
        `${successResults.length} presigned URLs generated successfully`
      )

      // 添加缓存和性能提示头
      response.headers.set('Cache-Control', 'no-store')
      response.headers.set('X-Content-Type-Options', 'nosniff')

      return response
    } else {
      // 单个处理
      const singleBody = body as SinglePresignedUrlRequest

      // 处理单个文件的配置
      const singleExpiresIn = Math.max(
        CONFIG.MIN_EXPIRES_IN,
        Math.min(
          singleBody.expiresIn || CONFIG.DEFAULT_EXPIRES_IN,
          CONFIG.MAX_EXPIRES_IN
        )
      )

      const result = await generateSinglePresignedUrl(
        client,
        endpointUrl,
        singleBody.fileName,
        singleBody.fileType,
        singleBody.path,
        singleExpiresIn,
        singleBody.maxFileSize
      )

      const response = createSuccessResponse(
        result,
        'Presigned URL generated successfully'
      )

      // 添加安全和缓存头
      response.headers.set('Cache-Control', 'no-store')
      response.headers.set('X-Content-Type-Options', 'nosniff')

      return response
    }
  } catch (error) {
    console.error('Error generating presigned URL:', error)

    // 检查是否是配置错误
    if (
      error instanceof Error &&
      error.message.includes('environment variables')
    ) {
      return createErrorResponse(
        COMMON_ERROR.SYSTEM_ERROR,
        error.message,
        null,
        500
      )
    }

    return createErrorResponse(
      COMMON_ERROR.SYSTEM_ERROR,
      'Failed to generate presigned URL',
      error,
      500
    )
  }
}

export const POST = withAuthenticatedApiHandler(generatePresignedUrlHandler)
