import { FileType } from './file'

// 图片变换选项接口
export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'jpeg' | 'png' | 'gif'
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
  gravity?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right'
  blur?: number
  sharpen?: number
  brightness?: number
  contrast?: number
  gamma?: number
  metadata?: 'keep' | 'copyright' | 'none'
}

// 存储配置
export const STORAGE_CONFIG = {
  // R2 存储配置
  r2PublicUrl:
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL,
  r2CustomDomain: process.env.NEXT_PUBLIC_R2_CUSTOM_DOMAIN,

  // Cloudflare Image 配置
  cfImageUrl: process.env.NEXT_PUBLIC_CF_IMAGE_URL,
  cfImageAccountHash: process.env.NEXT_PUBLIC_CF_IMAGE_ACCOUNT_HASH,
  useCloudflareImage: process.env.NEXT_PUBLIC_USE_CF_IMAGE === 'true',

  // CDN 配置
  cdnUrl: process.env.NEXT_PUBLIC_CDN_URL,
  useCdn: process.env.NEXT_PUBLIC_USE_CDN === 'true',

  // 获取基础存储 URL（优先级：CDN > 自定义域名 > R2公共URL）
  get r2Url() {
    if (this.useCdn && this.cdnUrl) return this.cdnUrl.replace(/\/+$/, '')
    if (this.r2CustomDomain) return this.r2CustomDomain.replace(/\/+$/, '')
    if (this.r2PublicUrl) return this.r2PublicUrl.replace(/\/+$/, '')
    throw new Error('存储配置不完整：缺少 R2 公共 URL 或自定义域名')
  }
} as const

// 图片预设尺寸
export const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, fit: 'cover' as const },
  avatar: { width: 100, height: 100, fit: 'cover' as const },
  card: { width: 300, height: 200, fit: 'cover' as const },
  banner: { width: 1200, height: 400, fit: 'cover' as const },
  medium: { width: 600, height: 400, fit: 'scale-down' as const },
  large: { width: 1200, height: 800, fit: 'scale-down' as const },
  preview: { width: 800, height: 600, fit: 'scale-down' as const }
} as const

// 占位符映射
export const PLACEHOLDERS: Record<FileType, string> = {
  [FileType.IMAGE]: '/placeholders/image-placeholder.svg',
  [FileType.DOCUMENT]: '/placeholders/document-placeholder.svg',
  [FileType.AUDIO]: '/placeholders/audio-placeholder.svg',
  [FileType.VIDEO]: '/placeholders/video-placeholder.svg',
  [FileType.ARCHIVE]: '/placeholders/archive-placeholder.svg',
  [FileType.MODEL_3D]: '/placeholders/3d-model-placeholder.svg',
  [FileType.CODE]: '/placeholders/code-placeholder.svg',
  [FileType.OTHER]: '/placeholders/file-placeholder.svg'
}

// 响应式图片尺寸
export const RESPONSIVE_IMAGE_SIZES = [320, 640, 768, 1024, 1280, 1920] as const

// 默认图片质量
export const DEFAULT_IMAGE_QUALITY = 85
