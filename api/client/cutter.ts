import { get } from '@/lib/fetch'
import { ApiResponse } from '@/lib/server/types'
import type { CutterGroupNode, CutterNode, CutterType } from '@/types/cutter'

/**
 * 获取刀具树状结构数据
 * @returns 刀具树状结构
 */
export async function getCutterTree(): Promise<
  ApiResponse<(CutterGroupNode | CutterNode)[]>
> {
  return await get<(CutterGroupNode | CutterNode)[]>('/client/cutter/tree')
}

export async function getCutterTypes(): Promise<ApiResponse<CutterType[]>> {
  return await get<CutterType[]>('/client/cutter/types')
}
