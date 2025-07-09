import {
  FileType,
  FILE_PATTERNS,
  MIME_TO_EXTENSION,
  DEFAULT_FILE_EXTENSION
} from '@/constants/file'

/**
 * 将 Base64 字符串转换为 File 对象
 * @param base64Data Base64 格式的数据 (不含前缀)
 * @param filename 文件名
 * @param type 文件类型
 * @returns File 对象
 */
export function base64ToFile(
  base64Data: string,
  filename: string,
  type: string
): File {
  // 将 Base64 字符串转换为 Blob
  const byteString = atob(base64Data)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const int8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i)
  }

  const blob = new Blob([int8Array], { type })
  return new File([blob], filename, { type })
}

/**
 * 从 Data URL 中提取 Base64 数据和 MIME 类型
 * @param dataURL Data URL 字符串，如 "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * @returns 包含 Base64 数据和 MIME 类型的对象
 */
export function parseDataURL(dataURL: string): {
  base64Data: string
  mimeType: string
} {
  const matches = dataURL.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid Data URL format')
  }

  return {
    mimeType: matches[1],
    base64Data: matches[2]
  }
}

/**
 * 从图像 Data URL 创建文件对象
 * @param dataURL 图像的 Data URL
 * @param filename 文件名
 * @returns File 对象
 */
export function dataURLToFile(dataURL: string, filename: string): File {
  const { base64Data, mimeType } = parseDataURL(dataURL)
  return base64ToFile(base64Data, filename, mimeType)
}

/**
 * 获取文件扩展名
 * @param filename 文件名或文件路径
 * @returns 文件扩展名 (不含点)
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || ''
}

/**
 * 获取文件扩展名（包含点）
 * @param filePath 文件路径
 * @returns 文件扩展名（包含点，小写）
 */
export function getFileExtensionWithDot(filePath: string): string {
  const match = filePath.match(/\.[^/.]+$/)
  return match ? match[0].toLowerCase() : ''
}

/**
 * 从文件路径中获取文件名
 * @param filePath 文件路径
 * @returns 文件名
 */
export function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath
}

/**
 * 检查文件路径是否有效
 * @param filePath 文件路径
 * @returns 是否有效
 */
export function isValidFilePath(filePath: string | null | undefined): boolean {
  return Boolean(filePath?.trim())
}

/**
 * 从完整 URL 中提取路径部分
 * @param fullUrl 完整的 URL
 * @returns 路径部分
 */
export function extractPathFromUrl(fullUrl: string): string {
  if (!fullUrl) return ''

  try {
    return new URL(fullUrl).pathname.replace(/^\/+/, '')
  } catch {
    return fullUrl.replace(/^\/+/, '')
  }
}

/**
 * 从 MIME 类型获取文件扩展名
 * @param mimeType MIME 类型
 * @returns 文件扩展名 (不含点)
 */
export function getExtensionFromMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] || DEFAULT_FILE_EXTENSION
}

/**
 * 从文件扩展名获取 MIME 类型
 * @param extension 文件扩展名 (不含点)
 * @returns MIME 类型
 */
export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase()

  // 通过反向查找 MIME_TO_EXTENSION 来获取 MIME 类型
  for (const [mimeType, mappedExtension] of Object.entries(MIME_TO_EXTENSION)) {
    if (mappedExtension === ext) {
      return mimeType
    }
  }

  return ''
}

/**
 * 检测文件类型
 * @param filePath 文件路径
 * @returns 文件类型
 */
export function detectFileType(filePath: string): FileType {
  const cleanFilePath = filePath.toLowerCase().trim()

  for (const [type, pattern] of Object.entries(FILE_PATTERNS)) {
    if (pattern.test(cleanFilePath)) {
      return type as FileType
    }
  }

  return FileType.OTHER
}

/**
 * 文件类型检测函数
 */
export const isImageFile = (filePath: string): boolean =>
  detectFileType(filePath) === FileType.IMAGE
export const isVideoFile = (filePath: string): boolean =>
  detectFileType(filePath) === FileType.VIDEO
export const isDocumentFile = (filePath: string): boolean =>
  detectFileType(filePath) === FileType.DOCUMENT
export const is3DModelFile = (filePath: string): boolean =>
  detectFileType(filePath) === FileType.MODEL_3D

/**
 * 按文件类型分组
 * @param filePaths 文件路径数组
 * @returns 按文件类型分组的对象
 */
export function groupFilePathsByType(
  filePaths: (string | null | undefined)[]
): Record<FileType, string[]> {
  const groups = Object.values(FileType).reduce(
    (acc, type) => ({ ...acc, [type]: [] }),
    {} as Record<FileType, string[]>
  )

  filePaths.forEach(path => {
    if (path?.trim()) {
      const type = detectFileType(path)
      groups[type].push(path)
    }
  })

  return groups
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  /** 完整文件名（含扩展名） */
  fullName: string
  /** 文件名（不含扩展名） */
  name: string
  /** 文件扩展名（不含点） */
  extension: string
  /** 文件类型 */
  fileType: FileType
  /** MIME 类型 */
  mimeType: string
  /** 原始文件路径 */
  originalPath: string
}

/**
 * 解析文件路径，返回完整的文件信息
 * @param filePath 文件路径或文件名
 * @returns 包含文件名、扩展名、文件类型、MIME类型的对象
 */
export function parseFileInfo(filePath: string): FileInfo {
  // 获取完整文件名
  const fullName = getFileName(filePath)

  // 获取扩展名（不含点）
  const extension = getFileExtension(fullName)

  // 获取文件名（不含扩展名）
  const name = extension
    ? fullName.substring(0, fullName.lastIndexOf('.'))
    : fullName

  // 获取文件类型
  const fileType = detectFileType(filePath)

  // 获取 MIME 类型
  const mimeType = getMimeTypeFromExtension(extension)

  return {
    fullName,
    name,
    extension,
    fileType,
    mimeType,
    originalPath: filePath
  }
}

// 重新导出从 constants 导入的类型和枚举
export { FileType } from '@/constants/file'
