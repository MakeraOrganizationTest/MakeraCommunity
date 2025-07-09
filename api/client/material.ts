import { get } from '@/lib/fetch'
import { ApiResponse } from '@/lib/server/types'
import type { MaterialGroupNode, MaterialNode } from '@/types/material'

/**
 * 获取材质树状结构数据
 * @returns 材质树状结构
 */
export async function getMaterialTree(): Promise<
  ApiResponse<(MaterialGroupNode | MaterialNode)[]>
> {
  return await get<(MaterialGroupNode | MaterialNode)[]>(
    '/client/material/tree'
  )
}
