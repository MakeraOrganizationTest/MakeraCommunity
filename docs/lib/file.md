# 基础文件工具库使用指南

> 提供文件操作、类型检测、格式转换等基础工具函数

## 🚀 快速开始

### 基础导入

```typescript
import {
  FileType,
  detectFileType,
  isImageFile,
  getFileName,
  getFileExtension
} from '@/lib/file'

// 或者从常量文件直接导入类型
import { FileType } from '@/constants/file'

// 检测文件类型
const fileType = detectFileType('document.pdf') // FileType.DOCUMENT

// 检查是否为图片
if (isImageFile('photo.jpg')) {
  console.log('这是一个图片文件')
}

// 提取文件名和扩展名
const fileName = getFileName('path/to/file.jpg') // 'file.jpg'
const extension = getFileExtension('file.jpg') // 'jpg'
```

## 📋 核心 API

### 文件类型系统

#### `FileType` 枚举

支持的文件类型分类：

```typescript
enum FileType {
  IMAGE = 'image',        // 图片文件
  DOCUMENT = 'document',  // 文档文件
  AUDIO = 'audio',        // 音频文件
  VIDEO = 'video',        // 视频文件
  ARCHIVE = 'archive',    // 压缩文件
  MODEL_3D = '3d_model',  // 3D 模型文件
  CODE = 'code',          // 代码文件
  OTHER = 'other'         // 其他文件
}
```

#### 支持的文件格式

| 类型       | 支持的扩展名                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **图片**   | `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`, `bmp`, `ico`, `tiff`                                                                                          |
| **文档**   | `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `txt`, `rtf`, `odt`, `ods`, `odp`                                                                     |
| **音频**   | `mp3`, `wav`, `flac`, `aac`, `ogg`, `m4a`, `wma`                                                                                                          |
| **视频**   | `mp4`, `avi`, `mov`, `wmv`, `flv`, `webm`, `mkv`, `m4v`, `3gp`                                                                                            |
| **压缩**   | `zip`, `rar`, `7z`, `tar`, `gz`, `bz2`, `xz`                                                                                                              |
| **3D模型** | `stl`, `obj`, `fbx`, `dae`, `3ds`, `ply`, `x3d`, `gltf`, `glb`, `blend`, `step`, `stp`, `iges`, `igs`, `sat`, `dwg`, `dxf`, `mkc`, `nc`, `gcode`          |
| **代码**   | `js`, `ts`, `jsx`, `tsx`, `py`, `java`, `cpp`, `c`, `h`, `cs`, `php`, `rb`, `go`, `rs`, `html`, `css`, `scss`, `less`, `json`, `xml`, `yaml`, `yml`, `md` |

### 文件类型检测

#### `detectFileType(filePath: string): FileType`

检测文件类型的核心函数。

```typescript
// 基础检测
detectFileType('image.jpg')     // FileType.IMAGE
detectFileType('document.pdf')  // FileType.DOCUMENT
detectFileType('video.mp4')     // FileType.VIDEO
detectFileType('model.stl')     // FileType.MODEL_3D
detectFileType('unknown.xyz')   // FileType.OTHER

// 路径检测
detectFileType('assets/images/photo.png')  // FileType.IMAGE
detectFileType('/path/to/file.js')         // FileType.CODE
```

#### 类型检测助手函数

```typescript
// 图片文件检测
isImageFile('photo.jpg')     // true
isImageFile('document.pdf')  // false

// 视频文件检测
isVideoFile('movie.mp4')     // true
isVideoFile('music.mp3')     // false

// 文档文件检测
isDocumentFile('report.pdf') // true
isDocumentFile('image.png')  // false

// 3D模型文件检测
is3DModelFile('part.stl')    // true
is3DModelFile('text.txt')    // false
```

### 文件路径工具

#### `getFileName(filePath: string): string`

从文件路径中提取文件名。

```typescript
getFileName('path/to/file.jpg')           // 'file.jpg'
getFileName('/assets/images/photo.png')   // 'photo.png'
getFileName('document.pdf')               // 'document.pdf'
getFileName('folder/subfolder/')          // 'subfolder'
```

#### `getFileExtension(filename: string): string`

获取文件扩展名（不含点）。

```typescript
getFileExtension('file.jpg')        // 'jpg'
getFileExtension('document.pdf')     // 'pdf'
getFileExtension('image.jpeg')       // 'jpeg'
getFileExtension('no-extension')     // ''
```

#### `getFileExtensionWithDot(filePath: string): string`

获取文件扩展名（包含点，小写）。

```typescript
getFileExtensionWithDot('file.JPG')     // '.jpg'
getFileExtensionWithDot('document.PDF') // '.pdf'
getFileExtensionWithDot('no-ext')       // ''
```

### 文件验证

#### `isValidFilePath(filePath: string | null | undefined): boolean`

检查文件路径是否有效。

```typescript
isValidFilePath('valid/path.jpg')  // true
isValidFilePath('file.txt')        // true
isValidFilePath('')                // false
isValidFilePath(null)              // false
isValidFilePath(undefined)         // false
isValidFilePath('   ')             // false
```

### URL 处理

#### `extractPathFromUrl(fullUrl: string): string`

从完整 URL 中提取路径部分。

```typescript
const url = 'https://example.com/images/photo.jpg'
extractPathFromUrl(url)  // 'images/photo.jpg'

const path = '/assets/files/document.pdf'
extractPathFromUrl(path)  // 'assets/files/document.pdf'

extractPathFromUrl('')  // ''
```

### 文件格式转换

#### Base64 和 Data URL 处理

```typescript
// 解析 Data URL
const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
const { mimeType, base64Data } = parseDataURL(dataUrl)
// mimeType: 'image/jpeg'
// base64Data: '/9j/4AAQSkZJRg...'

// Base64 转 File 对象
const file = base64ToFile(base64Data, 'photo.jpg', 'image/jpeg')

// Data URL 直接转 File 对象
const fileFromDataURL = dataURLToFile(dataUrl, 'photo.jpg')
```

#### MIME 类型转换

```typescript
// MIME 类型转扩展名
getExtensionFromMimeType('image/jpeg')     // 'jpg'
getExtensionFromMimeType('image/png')      // 'png'
getExtensionFromMimeType('application/pdf') // 'pdf'
getExtensionFromMimeType('text/plain')     // 'txt'
getExtensionFromMimeType('unknown/type')   // 'bin'
```

### 批量处理

#### `groupFilePathsByType(filePaths: Array): Record<FileType, string[]>`

按文件类型分组文件路径。

```typescript
const files = [
  'photo.jpg',
  'document.pdf',
  'video.mp4',
  'music.mp3',
  'model.stl',
  null,
  '',
  'script.js'
]

const grouped = groupFilePathsByType(files)
// {
//   image: ['photo.jpg'],
//   document: ['document.pdf'],
//   video: ['video.mp4'],
//   audio: ['music.mp3'],
//   '3d_model': ['model.stl'],
//   code: ['script.js'],
//   archive: [],
//   other: []
// }
```

## 🎨 React 组件示例

### 文件类型图标组件

```typescript
import { detectFileType, FileType } from '@/lib/file'

const FILE_ICONS = {
  [FileType.IMAGE]: '🖼️',
  [FileType.DOCUMENT]: '📄',
  [FileType.VIDEO]: '🎥',
  [FileType.AUDIO]: '🎵',
  [FileType.ARCHIVE]: '📦',
  [FileType.MODEL_3D]: '🎯',
  [FileType.CODE]: '💻',
  [FileType.OTHER]: '📎'
}

function FileIcon({ filePath }: { filePath: string }) {
  const fileType = detectFileType(filePath)
  const icon = FILE_ICONS[fileType]

  return <span className="file-icon">{icon}</span>
}
```

### 文件上传组件

```typescript
import {
  isImageFile,
  isVideoFile,
  getFileName,
  getFileExtension
} from '@/lib/file'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedTypes?: string[]
}

function FileUpload({ onFileSelect, acceptedTypes }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = file.name
    const isAccepted = acceptedTypes
      ? acceptedTypes.some(type => {
          switch (type) {
            case 'image':
              return isImageFile(fileName)
            case 'video':
              return isVideoFile(fileName)
            default:
              return getFileExtension(fileName) === type
          }
        })
      : true

    if (isAccepted) {
      onFileSelect(file)
    } else {
      alert(`不支持的文件类型: ${getFileExtension(fileName)}`)
    }
  }

  return (
    <input
      type="file"
      onChange={handleFileChange}
      className="file-upload"
    />
  )
}

// 使用示例
<FileUpload
  acceptedTypes={['image', 'pdf', 'mp4']}
  onFileSelect={(file) => console.log('选择的文件:', file.name)}
/>
```

### 文件列表组件

```typescript
import {
  groupFilePathsByType,
  getFileName,
  FileType
} from '@/lib/file'

function FileList({ files }: { files: string[] }) {
  const groupedFiles = groupFilePathsByType(files)

  const renderFileGroup = (type: FileType, files: string[]) => {
    if (files.length === 0) return null

    return (
      <div key={type} className="file-group">
        <h3>{type.toUpperCase()}</h3>
        <ul>
          {files.map((file, index) => (
            <li key={index}>
              <FileIcon filePath={file} />
              {getFileName(file)}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="file-list">
      {Object.entries(groupedFiles).map(([type, files]) =>
        renderFileGroup(type as FileType, files)
      )}
    </div>
  )
}
```

## 🔧 高级用法

### 文件类型过滤器

```typescript
import { detectFileType, FileType } from '@/lib/file'

class FileFilter {
  private allowedTypes: Set<FileType>

  constructor(allowedTypes: FileType[]) {
    this.allowedTypes = new Set(allowedTypes)
  }

  isAllowed(filePath: string): boolean {
    const fileType = detectFileType(filePath)
    return this.allowedTypes.has(fileType)
  }

  filter(files: string[]): string[] {
    return files.filter(file => this.isAllowed(file))
  }
}

// 使用示例
const imageFilter = new FileFilter([FileType.IMAGE])
const mediaFilter = new FileFilter([FileType.IMAGE, FileType.VIDEO])

const files = ['photo.jpg', 'video.mp4', 'document.pdf']
const images = imageFilter.filter(files)  // ['photo.jpg']
const media = mediaFilter.filter(files)   // ['photo.jpg', 'video.mp4']
```

### 批量文件处理器

```typescript
import {
  groupFilePathsByType,
  getFileName,
  getFileExtension,
  FileType
} from '@/lib/file'

class FileProcessor {
  static async processFiles(files: string[]) {
    const grouped = groupFilePathsByType(files)
    const results: Record<string, any> = {}

    // 处理图片文件
    if (grouped[FileType.IMAGE].length > 0) {
      results.images = await Promise.all(
        grouped[FileType.IMAGE].map(async (imagePath) => ({
          path: imagePath,
          name: getFileName(imagePath),
          extension: getFileExtension(imagePath),
          // 这里可以添加图片处理逻辑
        }))
      )
    }

    // 处理文档文件
    if (grouped[FileType.DOCUMENT].length > 0) {
      results.documents = grouped[FileType.DOCUMENT].map(docPath => ({
        path: docPath,
        name: getFileName(docPath),
        extension: getFileExtension(docPath),
        // 这里可以添加文档处理逻辑
      }))
    }

    return results
  }
}
```

## 💡 最佳实践

### 性能优化

```typescript
// ✅ 缓存文件类型检测结果
const fileTypeCache = new Map<string, FileType>()

function getCachedFileType(filePath: string): FileType {
  if (!fileTypeCache.has(filePath)) {
    fileTypeCache.set(filePath, detectFileType(filePath))
  }
  return fileTypeCache.get(filePath)!
}

// ✅ 批量处理文件
const files = ['file1.jpg', 'file2.pdf', 'file3.mp4']
const grouped = groupFilePathsByType(files) // 一次性分组
```

### 错误处理

```typescript
// ✅ 安全的文件路径检查
function safeFileOperation(filePath: string | null | undefined) {
  if (!isValidFilePath(filePath)) {
    throw new Error('无效的文件路径')
  }

  const fileType = detectFileType(filePath)
  // 继续处理...
}

// ✅ 安全的 Data URL 解析
function safeParseDataURL(dataURL: string) {
  try {
    return parseDataURL(dataURL)
  } catch (error) {
    console.error('Data URL 格式错误:', error)
    return null
  }
}
```

### 类型安全

```typescript
// ✅ 使用类型守卫
function isImagePath(filePath: string): filePath is string {
  return isImageFile(filePath)
}

function processImageFile(filePath: string) {
  if (isImagePath(filePath)) {
    // TypeScript 知道这里 filePath 是图片路径
    console.log('处理图片:', getFileName(filePath))
  }
}

// ✅ 使用联合类型
type SupportedFileType = FileType.IMAGE | FileType.VIDEO | FileType.DOCUMENT

function processSupportedFile(filePath: string, expectedType: SupportedFileType) {
  const actualType = detectFileType(filePath)

  if (actualType === expectedType) {
    // 处理文件
  } else {
    throw new Error(`期望 ${expectedType} 类型，实际为 ${actualType}`)
  }
}
```
