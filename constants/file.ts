/**
 * 文件相关常量定义
 */

// 文件类型枚举
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  ARCHIVE = 'archive',
  MODEL_3D = '3d_model',
  CODE = 'code',
  OTHER = 'other'
}

/**
 * 文件类型检测映射
 * 基于文件扩展名的正则表达式模式
 */
export const FILE_PATTERNS: Record<FileType, RegExp> = {
  [FileType.IMAGE]: /\.(jpe?g|png|gif|webp|svg|bmp|ico|tiff?)$/i,
  [FileType.DOCUMENT]: /\.(pdf|docx?|xlsx?|pptx?|txt|rtf|odt|ods|odp)$/i,
  [FileType.AUDIO]: /\.(mp3|wav|flac|aac|ogg|m4a|wma)$/i,
  [FileType.VIDEO]: /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp)$/i,
  [FileType.ARCHIVE]: /\.(zip|rar|7z|tar|gz|bz2|xz)$/i,
  [FileType.MODEL_3D]:
    /\.(stl|obj|fbx|dae|3ds|ply|x3d|gltf|glb|blend|step|stp|iges|igs|sat|dwg|dxf|mkc|nc|gcode)$/i,
  [FileType.CODE]:
    /\.(js|ts|jsx|tsx|py|java|cpp|c|h|cs|php|rb|go|rs|html|css|scss|less|json|xml|yaml|yml|md)$/i,
  [FileType.OTHER]: /^$/ // 永远不匹配，用于兜底
}

/**
 * MIME 类型到文件扩展名的映射
 * 用于从 MIME 类型推断文件扩展名
 */
export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/css': 'css',
  'text/javascript': 'js',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
  'application/x-7z-compressed': '7z',
  'video/mp4': 'mp4',
  'video/avi': 'avi',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg'
}

/**
 * 支持的文件扩展名按类型分组
 * 用于文档生成和验证
 */
export const SUPPORTED_EXTENSIONS = {
  [FileType.IMAGE]: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'bmp',
    'ico',
    'tiff'
  ],
  [FileType.DOCUMENT]: [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'rtf',
    'odt',
    'ods',
    'odp'
  ],
  [FileType.AUDIO]: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'],
  [FileType.VIDEO]: [
    'mp4',
    'avi',
    'mov',
    'wmv',
    'flv',
    'webm',
    'mkv',
    'm4v',
    '3gp'
  ],
  [FileType.ARCHIVE]: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  [FileType.MODEL_3D]: [
    'stl',
    'obj',
    'fbx',
    'dae',
    '3ds',
    'ply',
    'x3d',
    'gltf',
    'glb',
    'blend',
    'step',
    'stp',
    'iges',
    'igs',
    'sat',
    'dwg',
    'dxf',
    'mkc',
    'nc',
    'gcode'
  ],
  [FileType.CODE]: [
    'js',
    'ts',
    'jsx',
    'tsx',
    'py',
    'java',
    'cpp',
    'c',
    'h',
    'cs',
    'php',
    'rb',
    'go',
    'rs',
    'html',
    'css',
    'scss',
    'less',
    'json',
    'xml',
    'yaml',
    'yml',
    'md'
  ],
  [FileType.OTHER]: []
} as const

/**
 * 默认文件扩展名
 * 当无法确定 MIME 类型时使用
 */
export const DEFAULT_FILE_EXTENSION = 'bin'
