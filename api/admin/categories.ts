import { get, post, put, del } from '@/lib/fetch'
import { ApiResponse } from '@/lib/server/types'
import { CategoriesResponse, GetCategoriesParams } from '@/types/categories'
import { Category } from '@/types/categories'

/**
 * Get categories list
 * @param params Query parameters
 * @returns Categories list and pagination information
 */
export async function getCategories(params?: GetCategoriesParams) {
  const {
    page = 1,
    pageSize = 10000,
    searchTerm = '',
    tree = false,
    parentId = null
  } = params || {}

  return await get<CategoriesResponse>('/admin/categories', {
    page,
    pageSize,
    searchTerm,
    tree,
    parentId: parentId === null ? 'null' : parentId
  })
}

/**
 * Get permission details
 * @param id Category ID
 * @returns Category details
 */
export async function getCategoryDetails(id: number): Promise<Category> {
  const response = await get<ApiResponse<Category>>('/admin/categories', {
    id
  })
  return response.data as unknown as Category
}

/**
 * Create new category
 * @param category Category data
 * @returns Created category information
 */
export async function createCategory(
  category: Omit<Category, 'id' | 'created_at' | 'updated_at'>
) {
  return await post<Category>('/admin/categories', category)
}

/**
 * Update category
 * @param id Category ID
 * @param category Category data
 * @returns Updated category information
 */
export async function updateCategory(
  id: number,
  category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
) {
  return await put<Category>('/admin/categories', { id, ...category })
}

/**
 * Delete category
 * @param id Category ID
 * @returns Delete result
 */
export async function deleteCategory(id: number) {
  return await del<ApiResponse<{ id: number }>>('/admin/categories', { id })
}
