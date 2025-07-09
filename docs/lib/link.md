# 统一链接处理工具使用指南

> 文件链接处理工具，支持 Cloudflare R2 存储和 Image 服务

## 🚀 快速开始

### 环境变量配置

```bash
# R2 存储配置（必需）
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
# 或者使用自定义域名（推荐）
NEXT_PUBLIC_R2_CUSTOM_DOMAIN=https://files.yourdomain.com

# Cloudflare Image 配置（可选）
NEXT_PUBLIC_USE_CF_IMAGE=true
NEXT_PUBLIC_CF_IMAGE_URL=https://imagedelivery.net
NEXT_PUBLIC_CF_IMAGE_ACCOUNT_HASH=your-account-hash

# CDN 配置（可选）
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com
NEXT_PUBLIC_USE_CDN=true
```

### 基础使用

```typescript
import { getFileLink, getImageLink } from '@/lib/link'

// 处理任意文件
const pdfUrl = getFileLink('documents/manual.pdf')
const videoUrl = getFileLink('videos/demo.mp4')
const modelUrl = getFileLink('models/part.stl')

// 图片会自动使用最优格式（AVIF/WebP/原格式）
const imageUrl = getImageLink('images/photo.jpg')
const thumbnailUrl = getImageLink('images/photo.jpg', {
  width: 300,
  height: 200,
  fit: 'cover'
})
```

### 文件类型检测

> 💡 **注意：** 基础文件工具函数现已独立到 `@/lib/file` 模块

```typescript
import { FileType, isImageFile, isVideoFile, detectFileType } from '@/lib/file'
import { getFileLink, getImageLink } from '@/lib/link'

// 文件类型检测
if (isImageFile('photo.jpg')) {
  const url = getImageLink('photo.jpg')
}

// 文件类型枚举
const fileType = detectFileType('document.pdf') // FileType.DOCUMENT
```

## 📋 核心 API

### `getFileLink(filePath, options?)`

通用文件链接处理，支持所有文件类型。

```typescript
// 基础用法
getFileLink('documents/guide.pdf')
getFileLink('videos/intro.mp4')
getFileLink('models/prototype.stl')

// 空值安全
getFileLink(null) // 返回 null
getFileLink('') // 返回 null
```

### `getImageLink(imagePath, options?)`

图片专用处理，提供格式优化和变换。

```typescript
// 基础图片处理（自动格式优化）
getImageLink('images/photo.jpg')

// 图片变换
getImageLink('images/banner.jpg', {
  width: 1200,
  height: 400,
  fit: 'cover',
  quality: 85
})

// GIF 动画保护（不会转换格式）
getImageLink('images/animation.gif')
```

### `getImageLinkWithPreset(imagePath, preset, options?)`

使用预设尺寸的图片处理。

```typescript
// 可用预设：thumbnail, avatar, card, banner, medium, large, preview
getImageLinkWithPreset('images/avatar.jpg', 'avatar')
getImageLinkWithPreset('images/banner.jpg', 'banner')

// 预设 + 自定义选项
getImageLinkWithPreset('images/photo.jpg', 'thumbnail', {
  quality: 95,
  format: 'webp'
})
```

## 🎨 React 组件示例

### 智能图片组件

```typescript
import { getImageLink, getPlaceholderLink } from '@/lib/link'
import { FileType } from '@/lib/file'

interface SmartImageProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
}

function SmartImage({ src, alt, width, height }: SmartImageProps) {
  const imageUrl = src ? getImageLink(src, { width, height, fit: 'cover' }) : null
  const placeholder = getPlaceholderLink(FileType.IMAGE, { width, height })

  return (
    <img
      src={imageUrl || placeholder}
      alt={alt}
      onError={(e) => e.currentTarget.src = placeholder}
    />
  )
}
```

### 响应式图片组件

```typescript
import { getImageLink, getResponsiveImageSrcSet } from '@/lib/link'

function ResponsiveImage({ src, alt }: { src: string; alt: string }) {
  const fallbackSrc = getImageLink(src, { width: 800 })
  const srcSet = getResponsiveImageSrcSet(src)

  return (
    <img
      src={fallbackSrc || undefined}
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, 50vw"
      alt={alt}
      loading="lazy"
    />
  )
}
```

### 文件类型检测组件

```typescript
import { detectFileType, FileType } from '@/lib/file'
import { getFileLink, getPlaceholderLink } from '@/lib/link'

function FilePreview({ filePath }: { filePath: string }) {
  const fileType = detectFileType(filePath)
  const fileUrl = getFileLink(filePath)
  const placeholder = getPlaceholderLink(fileType)

  const renderPreview = () => {
    switch (fileType) {
      case FileType.IMAGE:
        return <img src={fileUrl || placeholder} alt="预览图" />
      case FileType.VIDEO:
        return <video src={fileUrl || undefined} controls />
      case FileType.DOCUMENT:
        return (
          <div className="document-preview">
            <img src={placeholder} alt="文档" />
            <a href={fileUrl || undefined} download>
              下载文档
            </a>
          </div>
        )
      default:
        return (
          <div className="file-preview">
            <img src={placeholder} alt="文件" />
            <a href={fileUrl || undefined} download>
              下载文件
            </a>
          </div>
        )
    }
  }

  return <div className="file-preview-container">{renderPreview()}</div>
}
```

## ⚡ 智能格式优化

### 自动格式选择

系统根据文件类型和浏览器自动选择最优格式：

| 文件类型                | 默认行为       | 说明                          |
| ----------------------- | -------------- | ----------------------------- |
| `.jpg`, `.jpeg`, `.png` | `auto`         | 智能选择 AVIF → WebP → 原格式 |
| `.gif`                  | **保持原格式** | 保留动画效果                  |
| `.svg`                  | **保持原格式** | 矢量格式                      |

### 浏览器支持

- **Chrome 85+, Firefox 86+, Safari 16.1+** → AVIF 格式
- **Chrome 23+, Firefox 65+, Safari 14+** → WebP 格式
- **老旧浏览器** → 原格式

### 格式控制

```typescript
// 默认：智能格式选择（推荐）
getImageLink('photo.jpg') // 浏览器自动获得最优格式

// 强制特定格式
getImageLink('photo.jpg', { format: 'webp' })
getImageLink('photo.jpg', { format: 'jpeg' })

// GIF 始终保持原格式
getImageLink('animation.gif') // 不会转换格式
```

## 🔧 实用工具

### 批量处理

```typescript
import { getFileLinks, getMultiSizeImageLinks } from '@/lib/link'

// 批量文件链接
const urls = getFileLinks(['doc.pdf', 'image.jpg', 'video.mp4'])

// 多尺寸图片
const imageUrls = getMultiSizeImageLinks('photo.jpg', ['thumbnail', 'medium', 'large'])
```

### 文件工具函数

```typescript
import {
  isImageFile,
  isVideoFile,
  isDocumentFile,
  is3DModelFile,
  getFileName,
  getFileExtension,
  isValidFilePath,
  extractPathFromUrl,
  groupFilePathsByType
} from '@/lib/file'

// 文件类型检测
isImageFile('photo.jpg') // true
isVideoFile('video.mp4') // true
isDocumentFile('document.pdf') // true
is3DModelFile('model.stl') // true

// 文件路径工具
getFileName('path/to/file.jpg') // 'file.jpg'
getFileExtension('file.jpg') // 'jpg'
isValidFilePath('valid/path.jpg') // true
extractPathFromUrl('https://domain.com/path/file.jpg') // 'path/file.jpg'

// 文件分组
const files = ['image.jpg', 'video.mp4', 'doc.pdf']
const grouped = groupFilePathsByType(files)
// { image: ['image.jpg'], video: ['video.mp4'], document: ['doc.pdf'], ... }
```

### 配置检查

```typescript
import { getStorageConfig } from '@/lib/link'

const config = getStorageConfig()
console.log('当前配置:', config)
```

## 💡 最佳实践

### 性能优化

- ✅ 使用预设尺寸：`getImageLinkWithPreset(path, 'thumbnail')`
- ✅ 批量处理：`getFileLinks(paths)`
- ✅ 响应式图片：`getResponsiveImageSrcSet(path)`
- ✅ 模块按需导入：分别从 `link` 和 `file` 模块导入所需功能

### 错误处理

- ✅ 空值安全：`getFileLink(path)` 自动处理 null/undefined
- ✅ 占位符回退：`getPlaceholderLink(FileType.IMAGE)`
- ✅ 类型检查：`isImageFile(path)` 验证文件类型
- ✅ 配置检查：使用 `getStorageConfig()` 诊断配置问题

### 类型安全

```typescript
import type { ImageTransformOptions } from '@/lib/link'
import { FileType } from '@/lib/file'

// 类型安全的配置对象
const imageOptions: ImageTransformOptions = {
  width: 800,
  height: 600,
  fit: 'cover',
  quality: 85
}

// 类型安全的文件类型判断
const handleFile = (path: string) => {
  const type = detectFileType(path)

  switch (type) {
    case FileType.IMAGE:
      return getImageLink(path, imageOptions)
    case FileType.VIDEO:
      return getFileLink(path)
    default:
      return getPlaceholderLink(type)
  }
}
```
