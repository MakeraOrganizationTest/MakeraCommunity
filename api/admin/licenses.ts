import { get, post, put, del } from '@/lib/fetch'
import { License, GetLicensesParams, LicenseResponse } from '@/types/license'
import { ApiResponse } from '@/lib/server/types'

/**
 * 获取许可证列表
 * @param params 查询参数
 * @returns 许可证列表和分页信息
 */
export async function getLicenses(params?: GetLicensesParams) {
  const {
    page = 1,
    pageSize = 10,
    searchTerm = '',
    isActive = ''
  } = params || {}

  return await get<LicenseResponse>('/admin/licenses', {
    page,
    pageSize,
    searchTerm,
    isActive
  })
}

/**
 * 获取许可证详情
 * @param id 许可证ID
 * @returns 许可证详情
 */
export async function getLicenseDetails(id: string): Promise<License> {
  const response = await get<ApiResponse<License>>('/admin/licenses', { id })
  return response.data as unknown as License
}

/**
 * 创建许可证
 * @param licenseData 许可证数据
 * @returns 创建的许可证信息
 */
export async function createLicense(licenseData: Partial<License>) {
  return await post<License>('/admin/licenses', licenseData)
}

/**
 * 更新许可证
 * @param id 许可证ID
 * @param licenseData 许可证数据
 * @returns 更新后的许可证信息
 */
export async function updateLicense(id: string, licenseData: Partial<License>) {
  return await put<License>('/admin/licenses', { id, ...licenseData })
}

/**
 * 删除许可证
 * @param id 许可证ID
 * @returns 删除结果
 */
export async function deleteLicense(id: string) {
  return await del<ApiResponse<{ id: string }>>('/admin/licenses', { id })
}
