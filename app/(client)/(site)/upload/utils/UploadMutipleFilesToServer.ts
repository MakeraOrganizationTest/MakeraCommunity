/**
 * 多文件上传管理器（受控并发、队列、去重、进度回调、Promise 化）
 *
 * 功能：
 * - 支持多文件批量上传，最大并发数受控
 * - 队列管理，自动递归上传
 * - 文件去重与上传数量上限控制
 * - 支持上传进度回调
 * - 每个上传任务返回 Promise，resolve 上传结果
 * - 提供队列/已上传/重置/同步等辅助方法
 */
import { UploadFileResponse, UploadFileStatus } from '@/types/upload'
import { batchUploadFilesWithPresigned } from '@/api/client/upload'

// 最大并发上传数
const MAX_CONCURRENT = 5

// 生成文件唯一缓存 key（防止重复上传）
const getCacheKey = (file: File) => {
  return encodeURIComponent(
    `${encodeURIComponent(file.name)}_${file.size}_${file.lastModified}`
  )
}

// 队列项结构，描述单个上传任务
interface UploadTask {
  file: File // 待上传文件
  staticPath: string // 上传目标静态路径
  key: string // 文件唯一 key
  resolve: (res: UploadFileResponse) => void // 上传成功回调
  reject: (err: any) => void // 上传失败回调
  status: UploadFileStatus // 当前状态
}

// 上传任务队列（待上传）
const uploadQueue: UploadTask[] = []

// 已上传文件 key 列表（用于去重和上限判断）
let uploadedFiles: string[] = []
// 当前正在上传的任务数
let uploadingCount = 0

// 延迟批量上传定时器，防止重复调度
let uploadBatchTimer: any = null
/**
 * 触发下一批上传（防抖，避免重复触发）
 * @param maxCount 最大允许上传文件数
 * @param onProgressCb 进度回调
 */
function scheduleTryUploadNext(
  maxCount: number,
  onProgressCb?: (progress: number, file: File) => void
) {
  if (uploadBatchTimer) return
  uploadBatchTimer = setTimeout(() => {
    tryUploadNext(maxCount, onProgressCb)
    uploadBatchTimer = null
  }, 0)
}

/**
 * 实际上传调度逻辑，受控并发，批量上传
 * @param maxCount 最大允许上传文件数
 * @param onProgressCb 进度回调
 */
function tryUploadNext(
  maxCount: number,
  onProgressCb?: (progress: number, file: File) => void
) {
  // 并发已满、无任务、已达最大上传数时直接返回
  if (uploadingCount >= MAX_CONCURRENT) return
  if (uploadQueue.length === 0) return
  if (uploadedFiles.length >= maxCount) return

  // 计算本轮可上传数量
  const canUploadCount = Math.min(
    MAX_CONCURRENT - uploadingCount,
    maxCount - uploadedFiles.length,
    uploadQueue.length
  )
  if (canUploadCount <= 0) return

  // 取出本轮要上传的任务
  const tasksToUpload = uploadQueue.splice(0, canUploadCount)
  tasksToUpload.forEach(task => (task.status = 'uploading'))
  const files = tasksToUpload.map(t => t.file)
  const staticPath = tasksToUpload[0].staticPath
  uploadingCount += tasksToUpload.length

  // 调用批量上传接口
  batchUploadFilesWithPresigned(files, {
    path: `m/${staticPath}`,
    concurrent: MAX_CONCURRENT,
    onProgress: (fileIndex: number, progress: number) => {
      // 更新对应任务进度，并通过回调通知外部
      const task = tasksToUpload[fileIndex]
      if (task) {
        // 可扩展：task.progress = progress
        if (onProgressCb) onProgressCb(progress, task.file)
      }
    }
  })
    .then(resArr => {
      resArr.forEach((res, idx) => {
        const task = tasksToUpload[idx]
        const uploadRes: UploadFileResponse = {
          uid: task.key,
          fileName: files[idx].name, // 原始文件名
          size: files[idx].size,
          type: files[idx].type,
          lastModified: files[idx].lastModified,
          cacheKey: task.key,

          // 服务端返回的
          status: res.success ? 'done' : 'error',
          name: res.name || '', // 服务端命名
          key: res.key || '',
          url: res.key ? res.key : '',
          progress: 100,
          success: res.success,
          error: res.error
        }
        task.status = res.success ? 'done' : 'error'
        if (res.success) {
          // 成功 resolve
          task.resolve(uploadRes)
        } else {
          // 失败 reject
          task.reject(uploadRes)
        }
      })
    })
    .catch(err => {
      // 整批失败，所有任务 reject
      tasksToUpload.forEach(task => {
        task.status = 'error'
        task.reject(err)
      })
    })
    .finally(() => {
      uploadingCount -= tasksToUpload.length
      // 递归触发下一个批次
      tryUploadNext(maxCount, onProgressCb)
    })
}

/**
 * 添加单文件上传任务（队列+去重+上限判断）
 * @param file 待上传文件
 * @param staticPath 上传目标静态路径
 * @param maxCount 最大允许上传文件数
 * @param onProgressCb 进度回调
 * @returns Promise<UploadFileResponse[]>
 */
export async function UploadMutipleFilesToServer(
  file: File,
  staticPath: string,
  maxCount: number,
  onProgressCb?: (progress: number, file: File) => void
): Promise<UploadFileResponse[]> {
  if (!file) return Promise.reject('No file')

  // 队列+已上传总数超限直接 reject
  if (uploadQueue.length + uploadedFiles.length >= maxCount) {
    return Promise.reject('上传文件数已达上限')
  }

  // 判断缓存，防止重复上传
  const key = getCacheKey(file)
  if (
    uploadQueue.some(t => t.key === key) ||
    uploadedFiles.some(f => f === key)
  ) {
    return Promise.reject({ errorType: 'upload-duplicate', name: file.name })
  }
  // 新任务入队，初始状态设为 uploading
  return new Promise((resolve, reject) => {
    uploadQueue.push({
      file,
      staticPath,
      key,
      resolve: res => resolve([res]), // 保持返回数组格式
      reject,
      status: 'uploading' // 状态流转：入队即为 uploading，后续根据结果变更为 done/error
    })
    scheduleTryUploadNext(maxCount, onProgressCb)
  })
}

/**
 * 获取当前上传队列（调试/展示用）
 */
export function getUploadQueue() {
  return uploadQueue
}
/**
 * 获取已上传文件 key 列表
 */
export function getUploadedFiles() {
  return uploadedFiles
}
/**
 * 清空上传队列和计数（重置管理器）
 */
export function disposeUploadManager() {
  uploadQueue.length = 0
  uploadedFiles.length = 0
  uploadingCount = 0
}

/**
 * 同步外部已上传文件列表到缓存（如 antd Upload 组件 fileList）
 * @param fileList 外部文件列表
 */
export function syncUploadedFiles(fileList: any[]) {
  uploadedFiles =
    fileList
      ?.filter(f => f.response)
      .map(f => {
        // antd 成功返回的 response 里没有 name，只有 fileName
        return getCacheKey({
          ...f.response,
          name: f.response?.fileName
        })
      }) || []
}
