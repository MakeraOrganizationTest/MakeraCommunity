import { get, post, put, del } from '@/lib/fetch'
import { ApiResponse } from '@/lib/server/types'
import { Permission } from '@/types/permission'
import { User, Auth0UserSync } from '@/types/user'

/**
 * Get user info by ID or Auth0 ID
 * @param id User ID (UUID format)
 * @param auth0_id Auth0 user ID
 * @returns User info
 */
export async function getUserInfo({
  id,
  auth0_id
}: {
  id?: string
  auth0_id?: string
}): Promise<ApiResponse<User>> {
  if (!id && !auth0_id) {
    throw new Error('Either id or auth0_id must be provided')
  }

  const params: Record<string, string> = {}
  if (id) params.id = id
  if (auth0_id) params.auth0_id = auth0_id

  return await get<User>('/client/user', params)
}

/**
 * Sync user info with Auth0 data
 * @param userData Auth0 user data to sync
 * @param options Request options
 * @returns Success status
 */
export async function syncUser(
  userData: Auth0UserSync,
  options?: { showErrorToast?: boolean }
): Promise<ApiResponse<null>> {
  return await post<null>('/client/sync-user', userData, {
    showErrorToast: options?.showErrorToast ?? true
  })
}

/**
 * Get user permissions
 * @param id User ID
 * @returns User permissions
 */
export async function getUserPermissions(
  id: string
): Promise<ApiResponse<Permission[]>> {
  return await get<Permission[]>('/client/permission', { id })
}
