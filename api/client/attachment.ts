import { get, post, put, del } from '@/lib/fetch'
import { ApiResponse } from '@/lib/server/types'

// 附件类型定义
export interface ProjectAttachment {
  id: string
  project_id: string
  name: string
  description?: string | null
  file_path: string
  file_size: number
  file_type: string
  created_at: string
  updated_at: string
}

export interface ProjectAttachmentParams {
  id?: string
  project_id?: string
  name?: string
  description?: string
  file_path?: string
  file_size?: number
  file_type?: string
}

/**
 * 获取项目附件列表
 * @param projectId 项目ID
 * @returns 附件列表
 */
export async function getProjectAttachments(
  projectId: string
): Promise<ApiResponse<ProjectAttachment[]>> {
  return await get<ProjectAttachment[]>('/client/attachments', {
    project_id: projectId
  })
}

/**
 * 创建项目附件
 * @param params 附件参数
 * @returns 创建结果
 */
export async function createProjectAttachment(
  params: ProjectAttachmentParams
): Promise<ApiResponse<{ id: string }>> {
  return await post<{ id: string }>('/client/attachments', params)
}

/**
 * 更新项目附件
 * @param params 附件参数（必须包含id）
 * @returns 更新结果
 */
export async function updateProjectAttachment(
  params: ProjectAttachmentParams & { id: string }
): Promise<ApiResponse<null>> {
  return await put<null>('/client/attachments', params)
}

/**
 * 删除项目附件
 * @param id 附件ID
 * @returns 删除结果
 */
export async function deleteProjectAttachment(
  id: string
): Promise<ApiResponse<null>> {
  return await del<null>('/client/attachments', { id })
}
