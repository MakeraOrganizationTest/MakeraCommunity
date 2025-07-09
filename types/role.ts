import { BaseQueryParams } from '@/components/custom-table'
import { ApiResponse } from '@/lib/server/types'

export interface Role {
  id: number
  name: string
  description?: string
  is_system: boolean
  created_at?: string
  updated_at?: string
  permission_count?: number
  user_count?: number
}

export interface RoleWithPermissions extends Role {
  permissions: number[]
}

export interface GetRolesParams extends BaseQueryParams {
  searchTerm?: string
  status?: string
}

export type RoleResponse = ApiResponse<{
  data: Role[]
  total: number
  page?: number
  pageSize?: number
}>
