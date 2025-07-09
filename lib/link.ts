/**
 * 统一链接处理工具
 * 处理所有存储在 Cloudflare R2 的文件链接还原
 * 支持 Cloudflare Image 服务和其他文件类型
 */

import { detectFileType, FileType } from './file'
import {
  STORAGE_CONFIG,
  IMAGE_PRESETS,
  PLACEHOLDERS,
  RESPONSIVE_IMAGE_SIZES,
  DEFAULT_IMAGE_QUALITY,
  type ImageTransformOptions
} from '@/constants/link'

// 重新导出类型和常量以保持向后兼容性
export type { ImageTransformOptions }
export { IMAGE_PRESETS }

/**
 * 工具函数
 */
const isFullUrl = (path: string): boolean => {
  try {
    new URL(path)
    return true
  } catch {
    return false
  }
}

const cleanPath = (path: string): string =>
  path.replace(/^\/+/, '').replace(/\/+/g, '/')

const isGif = (path: string): boolean => /\.gif$/i.test(path)

/**
 * 构建 Cloudflare Image URL
 */
function buildCloudflareImageUrl(
  imagePath: string,
  options?: ImageTransformOptions
): string {
  const { cfImageUrl, cfImageAccountHash } = STORAGE_CONFIG

  if (!cfImageUrl || !cfImageAccountHash) {
    console.warn('Cloudflare Image 配置不完整，回退到 R2 存储')
    return buildR2Url(imagePath)
  }

  const params = new URLSearchParams()

  // 处理变换选项
  if (options) {
    const transforms = [
      ['w', options.width],
      ['h', options.height],
      ['q', options.quality],
      ['fit', options.fit],
      ['gravity', options.gravity],
      ['blur', options.blur],
      ['sharpen', options.sharpen],
      ['brightness', options.brightness],
      ['contrast', options.contrast],
      ['gamma', options.gamma],
      ['metadata', options.metadata]
    ] as const

    transforms.forEach(([key, value]) => {
      if (value !== undefined) params.set(key, value.toString())
    })

    // 处理格式：明确指定 > auto模式（非GIF） > 保持原格式（GIF）
    if (options.format && options.format !== 'auto') {
      params.set('f', options.format)
    } else if (!isGif(imagePath)) {
      params.set('f', 'auto')
    }
  } else if (!isGif(imagePath)) {
    // 无选项时，非GIF默认使用auto模式
    params.set('f', 'auto')
  }

  const cleanImagePath = cleanPath(imagePath)
  const queryString = params.toString()
  const baseUrl = `${cfImageUrl.replace(/\/+$/, '')}/${cfImageAccountHash}/${cleanImagePath}`

  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * 构建 R2 存储 URL
 */
function buildR2Url(filePath: string): string {
  return `${STORAGE_CONFIG.r2Url}/${cleanPath(filePath)}`
}

/**
 * 核心链接处理函数
 */
export function getFileLink(
  filePath: string | null | undefined,
  options?: ImageTransformOptions
): string | null {
  if (!filePath?.trim()) return null

  const trimmedPath = filePath.trim()
  if (isFullUrl(trimmedPath)) return trimmedPath

  const fileType = detectFileType(trimmedPath)

  // 图片类型且启用Cloudflare Image服务
  if (fileType === FileType.IMAGE && STORAGE_CONFIG.useCloudflareImage) {
    return buildCloudflareImageUrl(trimmedPath, options)
  }

  return buildR2Url(trimmedPath)
}

/**
 * 图片专用处理函数
 */
export function getImageLink(
  imagePath: string | null | undefined,
  options?: ImageTransformOptions
): string | null {
  if (!imagePath?.trim()) return null

  const fileType = detectFileType(imagePath)
  if (fileType !== FileType.IMAGE) {
    console.warn(`文件 ${imagePath} 不是图片类型`)
    return getFileLink(imagePath)
  }

  return getFileLink(imagePath, options)
}

/**
 * 使用预设的图片处理
 */
export function getImageLinkWithPreset(
  imagePath: string | null | undefined,
  preset: keyof typeof IMAGE_PRESETS,
  additionalOptions?: Partial<ImageTransformOptions>
): string | null {
  const presetOptions = IMAGE_PRESETS[preset]
  const mergedOptions = { ...presetOptions, ...additionalOptions }
  return getImageLink(imagePath, mergedOptions)
}

/**
 * 批量处理文件链接
 */
export function getFileLinks(
  filePaths: (string | null | undefined)[],
  options?: ImageTransformOptions
): (string | null)[] {
  return filePaths.map(path => getFileLink(path, options))
}

/**
 * 生成多尺寸图片链接
 */
export function getMultiSizeImageLinks(
  imagePath: string | null | undefined,
  presets: (keyof typeof IMAGE_PRESETS)[]
): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  presets.forEach(preset => {
    result[preset] = getImageLinkWithPreset(imagePath, preset)
  })
  return result
}

/**
 * 生成响应式图片源集
 */
export function getResponsiveImageSrcSet(
  imagePath: string | null | undefined
): string {
  if (!imagePath) return ''

  return RESPONSIVE_IMAGE_SIZES.map(width => {
    const url = getImageLink(imagePath, {
      width,
      fit: 'scale-down',
      quality: DEFAULT_IMAGE_QUALITY
    })
    return url ? `${url} ${width}w` : null
  })
    .filter(Boolean)
    .join(', ')
}

/**
 * 获取占位符链接
 */
export function getPlaceholderLink(
  fileType: FileType,
  options?: ImageTransformOptions
): string {
  const placeholderPath = PLACEHOLDERS[fileType]

  // 如果是图片占位符且有变换选项，尝试应用变换
  if (fileType === FileType.IMAGE && options) {
    return getImageLink(placeholderPath, options) || placeholderPath
  }

  return placeholderPath
}

/**
 * 导出配置（用于调试）
 */
export function getStorageConfig() {
  const { r2Url, ...config } = STORAGE_CONFIG
  return { ...config, r2Url } as const
}
