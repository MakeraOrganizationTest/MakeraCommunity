import { UPLOAD_FILE_SIZE, UPLOAD_FILE_TYPE } from '@/constants/upload'

export type UploadFileType =
  (typeof UPLOAD_FILE_TYPE)[keyof typeof UPLOAD_FILE_TYPE]

export type UploadFileSize =
  (typeof UPLOAD_FILE_SIZE)[keyof typeof UPLOAD_FILE_SIZE]

export type UploadFileStatus =
  | 'uploading'
  | 'done'
  | 'error'
  // | 'wait'
  | 'removed'

export type UploadFileResponse = {
  // 原始文件信息
  uid: string // antd生成的id
  cacheKey?: string // 自定义的key，用来控制缓存
  fileName: string
  status: UploadFileStatus // 上传状态
  size?: number
  type?: string
  lastModified?: number

  // 接口返回的key
  name: string
  key: string
  url: string
  progress?: number
  success?: boolean
  error?: any

  isDefault?: boolean // 是否是默认文件
  response?: {
    id?: string
    key?: string
  }
}

export type UploadFormFilesType = {
  id?: string
  fileName: string
  size: number
  type: string
  thumbnail?: string
  description?: string
  key: string
  cutters?: string[]
  blank?: string[]
}
