import { NextRequest } from 'next/server'
import {
  withApiHandler,
  createSuccessResponse,
  createErrorResponse,
  DATA_ERROR
} from '@/lib/server'
import { prisma } from '@/lib/prisma'
import type { ApiHandler } from '@/lib/server/types'

/**
 * @swagger
 * /api/client/cutter/tree:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取刀具树状结构数据
 *     description: 按照刀具分组层级返回树状刀具数据
 *     responses:
 *       200:
 *         description: 刀具树状数据获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cutter tree data retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/CutterGroupNode'
 *                       - $ref: '#/components/schemas/CutterNode'
 *                 timestamp:
 *                   type: integer
 *       500:
 *         description: 服务器内部错误
 */

interface CutterGroupNode {
  name: string
  id: string
  parent_id?: string | null
  order: number
  children?: (CutterGroupNode | CutterNode)[]
}

interface CutterNode {
  id: string
  name: string
  type_id: string
  group_id?: string | null
  type: string
}

const getCutterTreeHandler: ApiHandler = async (request: NextRequest) => {
  try {
    // 查询所有刀具分组，按order排序
    const cutterGroups = await prisma.cutterGroups.findMany({
      orderBy: { order: 'asc' }
    })

    // 查询所有刀具（使用关联查询获取类型信息）
    const cutters = await prisma.cutters.findMany({
      include: {
        type: {
          select: {
            name: true
          }
        }
      }
    })

    // 构建分组映射
    const groupMap = new Map<string, CutterGroupNode>()
    const rootGroups: (CutterGroupNode | CutterNode)[] = []

    // 初始化所有分组节点
    cutterGroups.forEach(group => {
      const groupNode: CutterGroupNode = {
        name: group.name,
        id: group.id,
        parent_id: group.parent_id,
        order: group.order,
        children: []
      }
      groupMap.set(group.id, groupNode)
    })

    // 构建分组树结构
    cutterGroups.forEach(group => {
      const groupNode = groupMap.get(group.id)!
      if (group.parent_id) {
        const parentNode = groupMap.get(group.parent_id)
        if (parentNode) {
          parentNode.children!.push(groupNode)
        }
      } else {
        rootGroups.push(groupNode)
      }
    })

    // 将刀具添加到对应的分组中
    cutters.forEach(cutter => {
      const cutterNode: CutterNode = {
        id: cutter.id,
        name: cutter.name,
        type_id: cutter.type_id,
        group_id: cutter.group_id,
        type: cutter.type.name
      }

      if (cutter.group_id) {
        const groupNode = groupMap.get(cutter.group_id)
        if (groupNode) {
          groupNode.children!.push(cutterNode)
        }
      } else {
        // 如果刀具没有分组，添加到根级别
        rootGroups.push(cutterNode)
      }
    })

    // 递归排序子节点 - 只按order排序
    const sortChildren = (node: CutterGroupNode) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          // 分组优先于刀具
          if (
            ('children' in a && !('children' in b)) ||
            (!('children' in a) && 'children' in b)
          ) {
            return 'children' in a ? -1 : 1
          }
          // 如果都有order字段，按order排序
          if ('order' in a && 'order' in b) {
            return a.order - b.order
          }
          return 0
        })

        // 递归排序子分组
        node.children.forEach(child => {
          if ('children' in child) {
            sortChildren(child as CutterGroupNode)
          }
        })
      }
    }

    // 对根级别排序
    rootGroups.sort((a, b) => {
      // 分组优先于刀具
      if (
        ('children' in a && !('children' in b)) ||
        (!('children' in a) && 'children' in b)
      ) {
        return 'children' in a ? -1 : 1
      }
      // 如果都有order字段，按order排序
      if ('order' in a && 'order' in b) {
        return a.order - b.order
      }
      return 0
    })

    // 递归排序所有子级别
    rootGroups.forEach(node => {
      if ('children' in node) {
        sortChildren(node as CutterGroupNode)
      }
    })

    return createSuccessResponse(
      rootGroups,
      'Cutter tree data retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve cutter tree data:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve cutter tree data',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getCutterTreeHandler)
