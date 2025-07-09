import { get, post, put, del } from '@/lib/fetch'
import {
  Role,
  GetRolesParams,
  RoleResponse,
  RoleWithPermissions
} from '@/types/role'
import { Permission } from '@/types/permission'
import { ApiResponse } from '@/lib/server/types'

/**
 * 获取角色列表
 * Get roles list
 * @param params 查询参数 (Query parameters)
 * @returns 角色列表和分页信息 (Roles list and pagination information)
 */
export async function getRoles(params?: GetRolesParams) {
  const { page = 1, pageSize = 10, searchTerm = '', status = '' } = params || {}

  return await get<RoleResponse>('/admin/roles', {
    page,
    pageSize,
    searchTerm,
    status
  })
}

/**
 * 获取角色详情
 * Get role details
 * @param id 角色ID (Role ID)
 * @returns 角色详情信息 (Role details)
 */
export async function getRoleDetails(id: number): Promise<RoleWithPermissions> {
  const response = await get<ApiResponse<RoleWithPermissions>>('/admin/roles', {
    id
  })
  return response.data as unknown as RoleWithPermissions
}

/**
 * 创建新角色
 * Create new role
 * @param role 角色数据 (Role data)
 * @returns 创建的角色信息 (Created role information)
 */
export async function createRole(
  role: Omit<Role, 'id' | 'created_at' | 'updated_at'> & {
    permissions?: number[]
  }
) {
  return await post<Role>('/admin/roles', role)
}

/**
 * 更新角色
 * Update role
 * @param id 角色ID (Role ID)
 * @param role 角色数据 (Role data)
 * @returns 更新后的角色信息 (Updated role information)
 */
export async function updateRole(
  id: number,
  role: Partial<Omit<Role, 'id' | 'created_at' | 'updated_at'>> & {
    permissions?: string[]
  }
) {
  return await put<Role>('/admin/roles', { id, ...role })
}

/**
 * 删除角色
 * Delete role
 * @param id 角色ID (Role ID)
 * @returns 删除结果 (Delete result)
 */
export async function deleteRole(id: number) {
  return await del<ApiResponse<{ id: number }>>('/admin/roles', { id })
}

/**
 * 获取所有权限列表
 * Get all permissions
 * @returns 权限列表 (Permissions list)
 */
export async function getAllPermissions() {
  return await get<{ data: Permission[] }>('/admin/permissions', {
    pageSize: 1000,
    tree: true
  })
}
