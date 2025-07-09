import { UPLOAD_FILE_SIZE } from '@/constants/upload'
import type { UploadFile } from 'antd'

export const checkFileSize = (file: UploadFile) => {
  return file?.size && file.size <= UPLOAD_FILE_SIZE.IMAGE
}
