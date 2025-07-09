import { BaseQueryParams } from '@/components/custom-table'
import { ApiResponse } from '@/lib/server/types'

export interface GetCategoriesParams extends BaseQueryParams {
  searchTerm?: string
  tree?: boolean // 是否返回树形结构
  parentId?: number | null // 父权限ID
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  parent_id?: number | null
  order: number
  is_active: boolean
  children?: Category[]
  created_at?: string
  updated_at?: string
}

// 定义为ApiResponse类型
export type CategoriesResponse = ApiResponse<{
  data: Category[]
  total: number
  page: number
  pageSize: number
}>
