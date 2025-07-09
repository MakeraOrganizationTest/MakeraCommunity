import JSZip from 'jszip'

/**
 * MKC文件解析结果接口
 */
export interface MKCParseResult {
  success: boolean
  message: string
  data?: {
    jsonContent: any // JSON文件的内容
    jsonFileName: string // JSON文件的名称
    allFiles: string[] // 压缩包中所有文件的列表
  }
}

/**
 * MKC文件解析选项
 */
export interface MKCParseOptions {
  /** 要查找的JSON文件名，默认为 contourPath.json */
  targetFileName?: string
}

/**
 * 解压MKC文件得到文件列表
 * @param file MKC文件对象
 * @returns 文件列表
 */
export async function extractMKCFileList(file: File): Promise<{
  success: boolean
  message: string
  files?: string[]
  zipContent?: JSZip
}> {
  try {
    // 验证文件格式
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.mkc') && !fileName.endsWith('.zip')) {
      return {
        success: false,
        message: '不支持的文件格式，仅支持 .mkc 和 .zip 文件'
      }
    }

    // 读取文件内容并解压
    const arrayBuffer = await file.arrayBuffer()
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(arrayBuffer)

    // 获取所有文件列表（排除目录）
    const files = Object.keys(zipContent.files).filter(
      fileName => !zipContent.files[fileName].dir
    )

    return {
      success: true,
      message: '解压成功',
      files,
      zipContent
    }
  } catch (error) {
    return {
      success: false,
      message: `解压失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 从文件列表中查找指定文件
 * @param files 文件列表
 * @param targetFileName 目标文件名
 * @returns 查找结果
 */
export function findTargetFile(
  files: string[],
  targetFileName: string
): {
  success: boolean
  message: string
  foundFile?: string
} {
  // 精确匹配
  const exactMatch = files.find(file => file === targetFileName)
  if (exactMatch) {
    return {
      success: true,
      message: '找到目标文件',
      foundFile: exactMatch
    }
  }

  // 文件名匹配（忽略路径）
  const nameMatch = files.find(file => {
    const fileName = file.split('/').pop() || ''
    return fileName === targetFileName
  })
  if (nameMatch) {
    return {
      success: true,
      message: '找到目标文件',
      foundFile: nameMatch
    }
  }

  // 模糊匹配（包含目标文件名）
  const fuzzyMatch = files.find(file =>
    file.toLowerCase().includes(targetFileName.toLowerCase())
  )
  if (fuzzyMatch) {
    return {
      success: true,
      message: '找到相似文件',
      foundFile: fuzzyMatch
    }
  }

  return {
    success: false,
    message: `未找到文件: ${targetFileName}`
  }
}

/**
 * 方法3：读取JSON文件内容
 * @param zipContent 解压后的ZIP内容
 * @param fileName 文件名
 * @returns JSON内容
 */
export async function readJSONFile(
  zipContent: JSZip,
  fileName: string
): Promise<{
  success: boolean
  message: string
  content?: any
}> {
  try {
    const file = zipContent.files[fileName]
    if (!file) {
      return {
        success: false,
        message: `文件不存在: ${fileName}`
      }
    }

    // 读取文件文本内容
    const text = await file.async('text')

    // 解析JSON
    const jsonContent = JSON.parse(text)

    return {
      success: true,
      message: '读取JSON成功',
      content: jsonContent
    }
  } catch (error) {
    return {
      success: false,
      message: `读取JSON失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 主要解析方法：从MKC文件中提取指定的JSON文件内容
 * @param file MKC文件对象
 * @param options 解析选项
 * @returns 解析结果
 */
export async function parseMKCFile(
  file: File,
  options: MKCParseOptions = {}
): Promise<MKCParseResult> {
  const { targetFileName = 'contourPath.json' } = options

  try {
    console.log('开始解析MKC文件:', file.name)

    // 步骤1：解压文件获取文件列表
    const extractResult = await extractMKCFileList(file)
    if (
      !extractResult.success ||
      !extractResult.files ||
      !extractResult.zipContent
    ) {
      return {
        success: false,
        message: extractResult.message
      }
    }

    console.log('解压完成，文件数量:', extractResult.files.length)
    console.log('文件列表:', extractResult.files)

    // 步骤2：查找目标JSON文件
    const findResult = findTargetFile(extractResult.files, targetFileName)
    if (!findResult.success || !findResult.foundFile) {
      return {
        success: false,
        message: `${findResult.message}。可用文件: ${extractResult.files.join(', ')}`
      }
    }

    console.log('找到目标文件:', findResult.foundFile)

    // 步骤3：读取JSON文件内容
    const readResult = await readJSONFile(
      extractResult.zipContent,
      findResult.foundFile
    )
    if (!readResult.success || !readResult.content) {
      return {
        success: false,
        message: readResult.message
      }
    }

    console.log('JSON解析完成:', Object.keys(readResult.content))

    return {
      success: true,
      message: '解析成功',
      data: {
        jsonContent: readResult.content,
        jsonFileName: findResult.foundFile,
        allFiles: extractResult.files
      }
    }
  } catch (error) {
    console.error('MKC文件解析失败:', error)
    return {
      success: false,
      message: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 验证MKC文件格式
 * @param file 文件对象
 * @returns 验证结果
 */
export async function validateMKCFile(file: File): Promise<{
  success: boolean
  message: string
  isValid?: boolean
}> {
  try {
    if (!file) {
      return {
        success: false,
        message: '文件不存在'
      }
    }

    // 检查文件扩展名
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.mkc') && !fileName.endsWith('.zip')) {
      return {
        success: true,
        message: '文件格式不支持',
        isValid: false
      }
    }

    // 尝试解压验证
    const arrayBuffer = await file.arrayBuffer()
    const zip = new JSZip()
    await zip.loadAsync(arrayBuffer)

    return {
      success: true,
      message: '文件格式验证通过',
      isValid: true
    }
  } catch (error) {
    return {
      success: false,
      message: `文件格式验证失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 获取MKC文件中所有文件的列表
 * @param file MKC文件对象
 * @returns 文件列表
 */
export async function getMKCFileList(file: File): Promise<{
  success: boolean
  message: string
  files?: string[]
}> {
  const result = await extractMKCFileList(file)
  return {
    success: result.success,
    message: result.message,
    files: result.files
  }
}
