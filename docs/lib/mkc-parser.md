# MKC 文件解析器使用指南

> MKC 文件解析工具，支持解压、文件查找、JSON 提取等功能

## 🚀 快速开始

### 依赖安装

```bash
npm install jszip
```

### 基础使用

```typescript
import { parseMKCFile, validateMKCFile } from '@/lib/mkc-parser'

// 解析 MKC 文件
const result = await parseMKCFile(file)
if (result.success) {
  console.log('JSON 内容:', result.data.jsonContent)
  console.log('文件列表:', result.data.allFiles)
} else {
  console.error('解析失败:', result.message)
}

// 验证文件格式
const validation = await validateMKCFile(file)
if (validation.isValid) {
  console.log('文件格式有效')
}
```

## 📋 核心 API

### 接口定义

#### `MKCParseResult`

解析结果接口，统一返回格式。

```typescript
interface MKCParseResult {
  success: boolean      // 解析是否成功
  message: string       // 状态消息
  data?: {
    jsonContent: any    // JSON 文件的内容
    jsonFileName: string // JSON 文件的名称
    allFiles: string[]  // 压缩包中所有文件的列表
  }
}
```

#### `MKCParseOptions`

解析选项配置。

```typescript
interface MKCParseOptions {
  /** 要查找的JSON文件名，默认为 contourPath.json */
  targetFileName?: string
}
```

### 主要功能函数

#### `parseMKCFile(file, options?): Promise<MKCParseResult>`

主要解析方法，从 MKC 文件中提取指定的 JSON 文件内容。

```typescript
// 基础解析（查找默认的 contourPath.json）
const result = await parseMKCFile(file)

// 指定目标文件名
const result = await parseMKCFile(file, {
  targetFileName: 'config.json'
})

// 处理结果
if (result.success && result.data) {
  const { jsonContent, jsonFileName, allFiles } = result.data
  console.log('JSON 内容:', jsonContent)
  console.log('文件名:', jsonFileName)
  console.log('所有文件:', allFiles)
}
```

#### `validateMKCFile(file): Promise<ValidationResult>`

验证 MKC 文件格式是否有效。

```typescript
const validation = await validateMKCFile(file)

if (validation.success) {
  if (validation.isValid) {
    console.log('文件有效:', validation.message)
  } else {
    console.log('文件无效:', validation.message)
  }
} else {
  console.error('验证失败:', validation.message)
}
```

#### `getMKCFileList(file): Promise<FileListResult>`

获取 MKC 文件中所有文件的列表。

```typescript
const listResult = await getMKCFileList(file)

if (listResult.success && listResult.files) {
  console.log('文件数量:', listResult.files.length)
  listResult.files.forEach(fileName => {
    console.log('- ', fileName)
  })
}
```

### 辅助功能函数

#### `extractMKCFileList(file): Promise<ExtractResult>`

解压 MKC 文件并获取文件列表和 ZIP 内容。

```typescript
const extractResult = await extractMKCFileList(file)

if (extractResult.success) {
  console.log('文件列表:', extractResult.files)
  // extractResult.zipContent 可用于后续文件读取
}
```

#### `findTargetFile(files, targetFileName): FindResult`

从文件列表中查找指定文件，支持多种匹配模式。

```typescript
const files = ['path/to/config.json', 'data/settings.json', 'readme.txt']

// 查找文件
const findResult = findTargetFile(files, 'config.json')

if (findResult.success) {
  console.log('找到文件:', findResult.foundFile)
  console.log('匹配信息:', findResult.message)
}
```

**匹配模式：**

1. **精确匹配** - 完全匹配文件路径
2. **文件名匹配** - 忽略路径，只匹配文件名
3. **模糊匹配** - 包含目标文件名的文件

#### `readJSONFile(zipContent, fileName): Promise<ReadResult>`

从 ZIP 内容中读取并解析 JSON 文件。

```typescript
// 需要先解压获取 zipContent
const extractResult = await extractMKCFileList(file)
if (extractResult.zipContent) {
  const readResult = await readJSONFile(
    extractResult.zipContent,
    'config.json'
  )

  if (readResult.success) {
    console.log('JSON 内容:', readResult.content)
  }
}
```

## 🎨 React 组件示例

### MKC 文件上传组件

```typescript
import React, { useState } from 'react'
import { parseMKCFile, validateMKCFile, type MKCParseResult } from '@/lib/mkc-parser'

interface MKCUploaderProps {
  onParsed: (result: MKCParseResult) => void
  targetFileName?: string
}

function MKCUploader({ onParsed, targetFileName }: MKCUploaderProps) {
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setParsing(true)

    try {
      // 先验证文件格式
      const validation = await validateMKCFile(file)
      if (!validation.success || !validation.isValid) {
        throw new Error(validation.message)
      }

      // 解析文件
      const result = await parseMKCFile(file, { targetFileName })
      onParsed(result)

      if (!result.success) {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败')
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="mkc-uploader">
      <input
        type="file"
        accept=".mkc,.zip"
        onChange={handleFileChange}
        disabled={parsing}
      />

      {parsing && <div className="loading">解析中...</div>}
      {error && <div className="error">错误: {error}</div>}
    </div>
  )
}
```

### 文件内容展示组件

```typescript
import React from 'react'
import { type MKCParseResult } from '@/lib/mkc-parser'

interface MKCContentViewerProps {
  parseResult: MKCParseResult
}

function MKCContentViewer({ parseResult }: MKCContentViewerProps) {
  if (!parseResult.success || !parseResult.data) {
    return <div className="error">解析失败: {parseResult.message}</div>
  }

  const { jsonContent, jsonFileName, allFiles } = parseResult.data

  return (
    <div className="mkc-content-viewer">
      <div className="section">
        <h3>解析结果</h3>
        <p>目标文件: {jsonFileName}</p>
        <p>总文件数: {allFiles.length}</p>
      </div>

      <div className="section">
        <h3>JSON 内容</h3>
        <pre className="json-content">
          {JSON.stringify(jsonContent, null, 2)}
        </pre>
      </div>

      <div className="section">
        <h3>所有文件</h3>
        <ul className="file-list">
          {allFiles.map((fileName, index) => (
            <li key={index} className="file-item">
              {fileName === jsonFileName ? (
                <strong>{fileName} (目标文件)</strong>
              ) : (
                fileName
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

### 完整的 MKC 处理组件

```typescript
import React, { useState } from 'react'
import { parseMKCFile, getMKCFileList, type MKCParseResult } from '@/lib/mkc-parser'

function MKCProcessor() {
  const [parseResult, setParseResult] = useState<MKCParseResult | null>(null)
  const [fileList, setFileList] = useState<string[]>([])
  const [selectedTarget, setSelectedTarget] = useState('contourPath.json')

  const handleFileSelect = async (file: File) => {
    // 获取文件列表供用户选择
    const listResult = await getMKCFileList(file)
    if (listResult.success && listResult.files) {
      setFileList(listResult.files)
    }

    // 解析文件
    const result = await parseMKCFile(file, {
      targetFileName: selectedTarget
    })
    setParseResult(result)
  }

  const handleTargetChange = async (newTarget: string, file: File) => {
    setSelectedTarget(newTarget)

    // 重新解析
    const result = await parseMKCFile(file, {
      targetFileName: newTarget
    })
    setParseResult(result)
  }

  return (
    <div className="mkc-processor">
      <MKCUploader
        onParsed={setParseResult}
        targetFileName={selectedTarget}
      />

      {fileList.length > 0 && (
        <div className="target-selector">
          <label>选择目标文件:</label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
          >
            {fileList
              .filter(file => file.endsWith('.json'))
              .map(file => (
                <option key={file} value={file.split('/').pop()}>
                  {file}
                </option>
              ))}
          </select>
        </div>
      )}

      {parseResult && <MKCContentViewer parseResult={parseResult} />}
    </div>
  )
}
```

## 🔧 高级用法

### 批量 MKC 文件处理

```typescript
import { parseMKCFile, type MKCParseResult } from '@/lib/mkc-parser'

class MKCBatchProcessor {
  async processFiles(
    files: File[],
    targetFileName: string = 'contourPath.json'
  ): Promise<MKCParseResult[]> {
    const results: MKCParseResult[] = []

    for (const file of files) {
      try {
        console.log(`处理文件: ${file.name}`)
        const result = await parseMKCFile(file, { targetFileName })
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          message: `处理文件 ${file.name} 时出错: ${error instanceof Error ? error.message : '未知错误'}`
        })
      }
    }

    return results
  }

  async processWithProgress(
    files: File[],
    onProgress: (current: number, total: number, fileName: string) => void,
    targetFileName?: string
  ): Promise<MKCParseResult[]> {
    const results: MKCParseResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      onProgress(i + 1, files.length, file.name)

      const result = await parseMKCFile(file, { targetFileName })
      results.push(result)
    }

    return results
  }
}

// 使用示例
const processor = new MKCBatchProcessor()

const results = await processor.processWithProgress(
  files,
  (current, total, fileName) => {
    console.log(`进度: ${current}/${total} - ${fileName}`)
  },
  'config.json'
)
```

### 智能文件查找器

```typescript
import { extractMKCFileList, findTargetFile } from '@/lib/mkc-parser'

class SmartFileFinder {
  async findBestMatch(
    file: File,
    possibleNames: string[]
  ): Promise<{
    success: boolean
    foundFile?: string
    matchType?: 'exact' | 'name' | 'fuzzy'
    allMatches?: string[]
  }> {
    const extractResult = await extractMKCFileList(file)
    if (!extractResult.success || !extractResult.files) {
      return { success: false }
    }

    const allMatches: string[] = []
    let bestMatch: { file: string; type: 'exact' | 'name' | 'fuzzy' } | null = null

    for (const targetName of possibleNames) {
      const findResult = findTargetFile(extractResult.files, targetName)

      if (findResult.success && findResult.foundFile) {
        allMatches.push(findResult.foundFile)

        if (!bestMatch) {
          // 确定匹配类型
          const matchType = extractResult.files.includes(targetName)
            ? 'exact'
            : extractResult.files.some(f => f.split('/').pop() === targetName)
            ? 'name'
            : 'fuzzy'

          bestMatch = { file: findResult.foundFile, type: matchType }
        }
      }
    }

    if (bestMatch) {
      return {
        success: true,
        foundFile: bestMatch.file,
        matchType: bestMatch.type,
        allMatches
      }
    }

    return { success: false }
  }
}

// 使用示例
const finder = new SmartFileFinder()
const result = await finder.findBestMatch(file, [
  'contourPath.json',
  'config.json',
  'settings.json',
  'data.json'
])

if (result.success) {
  console.log(`找到最佳匹配: ${result.foundFile} (${result.matchType})`)
}
```

## 💡 最佳实践

### 错误处理

```typescript
import { parseMKCFile, validateMKCFile } from '@/lib/mkc-parser'

async function safeParseMKC(file: File, targetFileName?: string) {
  try {
    // 1. 预验证
    const validation = await validateMKCFile(file)
    if (!validation.success) {
      throw new Error(`验证失败: ${validation.message}`)
    }

    if (!validation.isValid) {
      throw new Error('不支持的文件格式')
    }

    // 2. 解析文件
    const result = await parseMKCFile(file, { targetFileName })

    if (!result.success) {
      throw new Error(`解析失败: ${result.message}`)
    }

    return result
  } catch (error) {
    console.error('MKC 解析出错:', error)

    // 返回标准错误格式
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}
```

### 性能优化

```typescript
// ✅ 使用缓存避免重复解析
const parseCache = new Map<string, MKCParseResult>()

async function cachedParseMKC(file: File, targetFileName?: string) {
  const cacheKey = `${file.name}-${file.size}-${targetFileName || 'default'}`

  if (parseCache.has(cacheKey)) {
    return parseCache.get(cacheKey)!
  }

  const result = await parseMKCFile(file, { targetFileName })
  parseCache.set(cacheKey, result)

  return result
}

// ✅ 批量处理时使用 Promise.allSettled
async function processMKCFilesConcurrently(files: File[]) {
  const promises = files.map(file =>
    parseMKCFile(file).catch(error => ({
      success: false,
      message: error.message
    }))
  )

  const results = await Promise.allSettled(promises)

  return results.map((result, index) => ({
    fileName: files[index].name,
    result: result.status === 'fulfilled' ? result.value : {
      success: false,
      message: result.reason?.message || '处理失败'
    }
  }))
}
```

### 类型安全

```typescript
import { type MKCParseResult } from '@/lib/mkc-parser'

// ✅ 类型守卫
function isSuccessfulParse(result: MKCParseResult): result is MKCParseResult & {
  success: true
  data: NonNullable<MKCParseResult['data']>
} {
  return result.success && result.data !== undefined
}

// ✅ 使用类型守卫
async function processSuccessfulParse(file: File) {
  const result = await parseMKCFile(file)

  if (isSuccessfulParse(result)) {
    // TypeScript 知道这里 result.data 存在
    const { jsonContent, jsonFileName, allFiles } = result.data
    console.log('处理成功的解析结果:', jsonFileName)
  } else {
    console.error('解析失败:', result.message)
  }
}

// ✅ 泛型约束
interface ConfigData {
  version: string
  settings: Record<string, any>
}

async function parseConfigMKC(file: File): Promise<ConfigData | null> {
  const result = await parseMKCFile(file, { targetFileName: 'config.json' })

  if (isSuccessfulParse(result)) {
    return result.data.jsonContent as ConfigData
  }

  return null
}
```

## 🚀 工具特色

### 🎯 灵活解析

- **多格式支持**: 支持 `.mkc` 和 `.zip` 格式文件
- **智能查找**: 支持精确匹配、文件名匹配、模糊匹配三种查找模式
- **可配置目标**: 可指定要提取的 JSON 文件名

### ⚡ 高效处理

- **流式解压**: 使用 JSZip 进行高效的文件解压
- **按需读取**: 只读取需要的文件内容，节省内存
- **批量处理**: 支持多文件并发处理

### 🛡️ 可靠性

- **格式验证**: 解析前验证文件格式
- **错误处理**: 完善的错误捕获和提示
- **类型安全**: 完整的 TypeScript 类型定义

### 🎨 易于集成

- **Promise 基础**: 所有异步操作基于 Promise
- **统一接口**: 标准化的返回格式
- **React 友好**: 提供完整的 React 组件示例

> 💡 **提示**: MKC 文件通常包含 3D 模型的配置信息，本工具专门用于提取其中的 JSON 配置文件。支持的文件查找策略确保能够找到目标配置文件。
