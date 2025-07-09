import { get, post, put, del } from '@/lib/fetch'
import {
  Permission,
  GetPermissionsParams,
  PermissionResponse
} from '@/types/permission'
import { ApiResponse } from '@/lib/server/types'

/**
 * Get permissions list
 * @param params Query parameters
 * @returns Permissions list and pagination information
 */
export async function getPermissions(params?: GetPermissionsParams) {
  const {
    page = 1,
    pageSize = 10000,
    searchTerm = '',
    type = '',
    tree = false,
    parentId = null
  } = params || {}

  return await get<PermissionResponse>('/admin/permissions', {
    page,
    pageSize,
    searchTerm,
    type,
    tree,
    parentId: parentId === null ? 'null' : parentId
  })
}

/**
 * Get permission details
 * @param id Permission ID
 * @returns Permission details
 */
export async function getPermissionDetails(id: number): Promise<Permission> {
  const response = await get<ApiResponse<Permission>>('/admin/permissions', {
    id
  })
  return response.data as unknown as Permission
}

/**
 * Create new permission
 * @param permission Permission data
 * @returns Created permission information
 */
export async function createPermission(
  permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>
) {
  return await post<Permission>('/admin/permissions', permission)
}

/**
 * Update permission
 * @param id Permission ID
 * @param permission Permission data
 * @returns Updated permission information
 */
export async function updatePermission(
  id: number,
  permission: Partial<Omit<Permission, 'id' | 'created_at' | 'updated_at'>>
) {
  return await put<Permission>('/admin/permissions', { id, ...permission })
}

/**
 * Delete permission
 * @param id Permission ID
 * @returns Delete result
 */
export async function deletePermission(id: number) {
  return await del<ApiResponse<{ id: number }>>('/admin/permissions', { id })
}
