import { ApiResponse } from '@/lib/server/types'
import { BaseQueryParams } from '@/components/custom-table'

/**
 * 许可证类型
 */
export interface License {
  id: string
  name: string
  code: string
  description: string
  thumbnail?: string | null
  link?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 许可证查询参数
 */
export interface GetLicensesParams extends BaseQueryParams {
  isActive?: string | boolean
}

/**
 * 许可证响应类型
 */
export type LicenseResponse = ApiResponse<{
  data: License[]
  count: number
  page: number
  pageSize: number
}>
