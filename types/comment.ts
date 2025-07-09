/**
 * 项目评论用户信息
 */
export interface ProjectCommentUser {
  id: string
  nick_name?: string
  picture?: string
}

/**
 * 项目评论信息
 */
export interface ProjectComment {
  id: string
  content: string
  user_id: string
  project_id: string
  parent_id?: string
  images: string[]
  likes_count: number
  is_liked?: boolean
  visibility: 'public' | 'private'
  created_at: string
  updated_at: string
  user: ProjectCommentUser
  parent?: {
    id: string
    user: ProjectCommentUser
  }
  replies?: ProjectComment[]
  replies_count?: number
}

/**
 * 项目评论列表响应
 */
export interface ProjectCommentsResponse {
  comments: ProjectComment[]
  pagination: {
    page: number
    limit: number
    total: number
    has_next: boolean
  }
}

/**
 * 项目评论查询参数
 */
export interface ProjectCommentParams {
  project_id: string
  sort?: 'hot' | 'new'
  page?: number
  limit?: number
  parent_id?: string
}

/**
 * 项目评论创建参数
 */
export interface CreateProjectCommentParams {
  project_id: string
  content: string
  parent_id?: string
  images?: string[]
}

/**
 * 项目评论更新参数
 */
export interface UpdateProjectCommentParams {
  id: string
  content: string
  images?: string[]
}
