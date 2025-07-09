export const UPLOAD_FILE_TYPE = {
  IMAGE: 'image/png, image/jpeg, image/jpg, image/gif',
  VIDEO: 'video/mp4, video/mov, video/avi, video/wmv, video/flv, video/mkv',
  AUDIO: 'audio/mp3, audio/wav, audio/m4a, audio/aac, audio/ogg',
  DOCUMENT:
    'application/pdf, application/doc, application/docx, application/xls, application/xlsx, application/ppt, application/pptx'
} as const

export const UPLOAD_FILE_SIZE = {
  IMAGE: 100 * 1024 * 1024
} as const

export const UPLOAD_TOAST_MESSAGE = {
  IMAGE_COUNT_LIMIT_EXCEEDED: 'Your file amount exceeds the limit',
  IMAGE_SIZE_TOO_LARGE: 'Image size must be less than 25MB'
} as const

// R2 url prefix
export const UPLOAD_BASE_URL =
  'https://pub-c6657a8ca5ae479391474fda6501e587.r2.dev'

/**
 * project: 项目基本信息
 * files: CAM文件
 * original_files: 3D模型文件
 * attachments: 附件
 */
export enum FIELD_TYPE {
  PROJECT_ID = 'projectId',
  PROJECT = 'project',
  FILES = 'files',
  ORIGINAL_FILES = 'original_files',
  ATTACHMENTS = 'attachments',
  CAM_DRAGGER = 'CAMDragger'
}
