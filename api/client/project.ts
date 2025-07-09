import { post, get, put, del } from '@/lib/fetch'
import { ApiResponse } from '@/lib/server/types'
import type {
  Project,
  ProjectParams,
  ProjectFile,
  ProjectFileParams,
  ProjectOriginalFile,
  ProjectOriginalFileParams,
  ProjectCategory,
  ProjectCategoryNode,
  ProjectTag
} from '@/types/project'
import type {
  ProjectComment,
  ProjectCommentsResponse,
  ProjectCommentParams,
  CreateProjectCommentParams,
  UpdateProjectCommentParams
} from '@/types/comment'
import type { LikeParams, LikeResponse } from '@/types/like'

/**
 * 获取项目详细信息
 * @param id 项目ID
 * @returns 项目详细信息
 */
export async function getProjectInfo(
  id: string,
  options: {
    headers?: Record<string, string>
  } = {}
): Promise<ApiResponse<Project>> {
  return await get<Project>('/client/project', { id }, options)
}

/**
 * 创建项目
 * @param params 项目参数
 * @returns 创建结果
 */
export async function createProject(
  params: ProjectParams
): Promise<ApiResponse<{ id: string }>> {
  return await post<{ id: string }>('/client/project', {
    ...params,
    ...(params.tag_ids && { tag_ids: params.tag_ids?.map(id => Number(id)) }),
    ...(params.category_id && { category_id: Number(params.category_id) })
  })
}

/**
 * 更新项目
 * @param params 项目参数（必须包含id）
 * @returns 更新结果
 */
export async function updateProject(
  params: ProjectParams & { id: string }
): Promise<ApiResponse<{ id: string }>> {
  return await post<{ id: string }>('/client/project', {
    ...params,
    ...(params.tag_ids && { tag_ids: params.tag_ids?.map(id => Number(id)) }),
    ...(params.category_id && { category_id: Number(params.category_id) })
  })
}

/**
 * 获取项目文件列表
 * @param projectId 项目ID
 * @returns 项目文件列表
 */
export async function getProjectFiles(
  projectId: string
): Promise<ApiResponse<ProjectFile[]>> {
  return await get<ProjectFile[]>('/client/project/files', {
    project_id: projectId
  })
}

/**
 * 创建项目文件
 * @param params 项目文件参数
 * @returns 创建结果
 */
export async function createProjectFile(
  params: ProjectFileParams
): Promise<ApiResponse<{ id: string }>> {
  return await post<{ id: string }>('/client/project/files', params)
}

/**
 * 更新项目文件
 * @param params 项目文件参数（必须包含id）
 * @returns 更新结果
 */
export async function updateProjectFile(
  params: ProjectFileParams & { id: string }
): Promise<ApiResponse<null>> {
  return await put<null>('/client/project/files', params)
}

/**
 * 删除项目文件
 * @param id 项目文件ID
 * @returns 删除结果
 */
export async function deleteProjectFile(
  id: string
): Promise<ApiResponse<null>> {
  return await del<null>('/client/project/files', { id })
}

/**
 * 获取项目原始文件列表
 * @param projectId 项目ID
 * @returns 项目原始文件列表
 */
export async function getProjectOriginalFiles(
  projectId: string
): Promise<ApiResponse<ProjectOriginalFile[]>> {
  return await get<ProjectOriginalFile[]>('/client/project/original-files', {
    project_id: projectId
  })
}

/**
 * 创建项目原始文件
 * @param params 原始文件参数
 * @returns 创建结果
 */
export async function createProjectOriginalFile(
  params: ProjectOriginalFileParams
): Promise<ApiResponse<{ id: string }>> {
  return await post<{ id: string }>('/client/project/original-files', params)
}

/**
 * 更新项目原始文件
 * @param params 原始文件参数（必须包含id）
 * @returns 更新结果
 */
export async function updateProjectOriginalFile(
  params: ProjectOriginalFileParams & { id: string }
): Promise<ApiResponse<null>> {
  return await put<null>('/client/project/original-files', params)
}

/**
 * 删除项目原始文件
 * @param id 原始文件ID
 * @returns 删除结果
 */
export async function deleteProjectOriginalFile(
  id: string
): Promise<ApiResponse<null>> {
  return await del<null>('/client/project/original-files', { id })
}

/**
 * 获取项目分类列表
 * @returns 项目分类列表
 */
export async function getProjectCategories(): Promise<
  ApiResponse<ProjectCategory[]>
> {
  return await get<ProjectCategory[]>('/client/project/categories')
}

/**
 * 获取项目分类树形结构
 * @returns 项目分类树形结构
 */
export async function getProjectCategoriesTree(): Promise<
  ApiResponse<ProjectCategoryNode[]>
> {
  return await get<ProjectCategoryNode[]>('/client/project/categories/tree')
}

/**
 * 获取项目标签列表
 * @returns 项目标签列表
 */
export async function getProjectTags(): Promise<ApiResponse<ProjectTag[]>> {
  return await get<ProjectTag[]>('/client/project/tags')
}

/**
 * 获取项目评论列表
 * @param params 查询参数
 * @returns 项目评论列表
 */
export async function getProjectComments(
  params: ProjectCommentParams
): Promise<ApiResponse<ProjectCommentsResponse>> {
  return await get<ProjectCommentsResponse>('/client/project/comment', params)
}

/**
 * 创建项目评论
 * @param params 评论创建参数
 * @returns 创建的评论信息
 */
export async function createProjectComment(
  params: CreateProjectCommentParams
): Promise<ApiResponse<ProjectComment>> {
  return await post<ProjectComment>('/client/project/comment', params)
}

/**
 * 更新项目评论
 * @param params 评论更新参数
 * @returns 更新后的评论信息
 */
export async function updateProjectComment(
  params: UpdateProjectCommentParams
): Promise<ApiResponse<ProjectComment>> {
  return await put<ProjectComment>('/client/project/comment', params)
}

/**
 * 删除项目评论
 * @param id 评论ID
 * @returns 删除结果
 */
export async function deleteProjectComment(
  id: string
): Promise<ApiResponse<null>> {
  return await del<null>('/client/project/comment', { id })
}

/**
 * 点赞/取消点赞
 * @param params 点赞参数
 * @returns 点赞结果
 */
export async function toggleLike(
  params: LikeParams
): Promise<ApiResponse<LikeResponse>> {
  return await post<LikeResponse>('/client/project/like', params)
}

/**
 * 项目点赞
 * @param projectId 项目ID
 * @returns 点赞结果
 */
export async function likeProject(
  projectId: string
): Promise<ApiResponse<LikeResponse>> {
  return await post<LikeResponse>('/client/project/like', {
    content_type: 'model',
    content_id: projectId,
    action: 'like'
  })
}

/**
 * 项目取消点赞
 * @param projectId 项目ID
 * @returns 取消点赞结果
 */
export async function unlikeProject(
  projectId: string
): Promise<ApiResponse<LikeResponse>> {
  return await post<LikeResponse>('/client/project/like', {
    content_type: 'model',
    content_id: projectId,
    action: 'unlike'
  })
}

/**
 * 评论点赞
 * @param commentId 评论ID
 * @returns 点赞结果
 */
export async function likeComment(
  commentId: string
): Promise<ApiResponse<LikeResponse>> {
  return await post<LikeResponse>('/client/project/like', {
    content_type: 'comment',
    content_id: commentId,
    action: 'like'
  })
}

/**
 * 评论取消点赞
 * @param commentId 评论ID
 * @returns 取消点赞结果
 */
export async function unlikeComment(
  commentId: string
): Promise<ApiResponse<LikeResponse>> {
  return await post<LikeResponse>('/client/project/like', {
    content_type: 'comment',
    content_id: commentId,
    action: 'unlike'
  })
}

/**
 * 自动切换点赞状态（项目）
 * @param projectId 项目ID
 * @returns 点赞结果
 */
export async function toggleProjectLike(
  projectId: string
): Promise<ApiResponse<LikeResponse>> {
  return await post<LikeResponse>('/client/project/like', {
    content_type: 'model',
    content_id: projectId
  })
}

/**
 * 自动切换点赞状态（评论）
 * @param commentId 评论ID
 * @returns 点赞结果
 */
export async function toggleCommentLike(
  commentId: string
): Promise<ApiResponse<LikeResponse>> {
  return await post<LikeResponse>('/client/project/like', {
    content_type: 'comment',
    content_id: commentId
  })
}
