import { BaseQueryParams } from '@/components/custom-table'
import { Role } from './role'
import { ApiResponse } from '@/lib/server/types'

// 性别枚举类型
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say'

// 用户状态枚举类型
export type UserStatusType =
  | 'active'
  | 'pending'
  | 'restricted'
  | 'banned'
  | 'inactive'

// 用户完整类型
export type User = {
  id: string
  auth0_id: string
  full_name?: string | null
  nick_name: string | null
  user_name: string | null
  picture: string | null
  email: string | null
  email_verified?: boolean | null
  bio?: string | null
  gender?: GenderType | null
  birthday?: Date | string | null
  status?: UserStatusType
  follower_count?: number
  following_count?: number
  is_deleted?: boolean
  deleted_at?: Date | string | null
  last_login_at?: Date | string | null
  created_at?: Date | string
  updated_at?: Date | string
  roles?: Role[]
}

// 用户查询参数
export interface GetUsersParams extends BaseQueryParams {
  searchTerm?: string
  status?: string
  role?: string
}

// 用户响应类型
export type UserResponse = ApiResponse<{
  data: User[]
  total: number
  page?: number
  pageSize?: number
}>

// 用户更新类型
export type UserUpdate = Partial<
  Omit<
    User,
    | 'id'
    | 'auth0_id'
    | 'follower_count'
    | 'following_count'
    | 'created_at'
    | 'updated_at'
    | 'roles'
  >
> & {
  roleIds?: number[]
}

// Auth0 用户同步数据类型
export type Auth0UserSync = {
  auth0_id: string
  full_name?: string | null
  nick_name?: string | null
  user_name?: string | null
  picture?: string | null
  email?: string | null
  email_verified?: boolean | null
}
