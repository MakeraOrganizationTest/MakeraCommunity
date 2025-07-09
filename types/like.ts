/**
 * 点赞操作参数
 */
export interface LikeParams {
  content_type: 'model' | 'comment'
  content_id: string
  action?: 'like' | 'unlike'
}

/**
 * 点赞操作响应
 */
export interface LikeResponse {
  liked: boolean
  like_count: number
}

/**
 * 内容类型枚举
 */
export type ContentType = 'model' | 'comment'

/**
 * 点赞动作枚举
 */
export type LikeAction = 'like' | 'unlike'
