import { UPLOAD_BASE_URL } from '@/constants/upload'
import { UploadFileResponse, UploadFileStatus } from '@/types/upload'
import { UploadFile } from 'antd'

// 生成文件唯一标识
export const getFileKey = (file: UploadFile) =>
  `${file.name}_${file.size}_${file.lastModified}`

// 把 antd upload 的file格式转为 标准的 UploadFileResponse 格式
export const transformUploadFileResp = (
  file: UploadFile,
  response: any
): UploadFileResponse => {
  return {
    // 原始文件信息
    name: file?.name || (file?.originFileObj as File)?.name,
    uid: file.uid,
    status: file?.status || (response?.status as UploadFileStatus),
    size: file.size,
    type: file.type,

    // 接口返回的key
    cacheKey: getFileKey(file),
    fileName: response?.fileName || '',
    key: response?.key || '',
    url: response?.key ? response.key : '',
    progress: response?.progress || 0,
    success: response?.success || false,
    error: response?.error || undefined
  }
}
