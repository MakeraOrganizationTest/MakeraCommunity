import { BaseQueryParams } from '@/components/custom-table'
import { ApiResponse } from '@/lib/server/types'

export interface Permission {
  id: number
  name: string
  code: string
  type: 'system' | 'page' | 'module' | 'operation' | 'data'
  description?: string
  parent_id: number | null
  children?: Permission[]
  level?: number
  created_at?: string
  updated_at?: string
}

export interface GetPermissionsParams extends BaseQueryParams {
  searchTerm?: string
  type?: string
  tree?: boolean // 是否返回树形结构
  parentId?: number | null // 父权限ID
}

// 定义为ApiResponse类型
export type PermissionResponse = ApiResponse<{
  data: Permission[]
  total: number
  page: number
  pageSize: number
}>
