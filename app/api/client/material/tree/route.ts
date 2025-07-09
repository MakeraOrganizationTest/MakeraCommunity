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
 * /api/client/material/tree:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取材质树状结构数据
 *     description: 按照材质分组层级返回树状材质数据
 *     responses:
 *       200:
 *         description: 材质树状数据获取成功
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
 *                   example: "Material tree data retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/MaterialGroupNode'
 *                       - $ref: '#/components/schemas/MaterialNode'
 *                 timestamp:
 *                   type: integer
 *       500:
 *         description: 服务器内部错误
 */

interface MaterialGroupNode {
  name: string
  id: string
  parent_id?: string | null
  order: number
  children?: (MaterialGroupNode | MaterialNode)[]
}

interface MaterialNode {
  id: string
  name: string
  type_id: string
  group_id?: string | null
  type: string
}

const getMaterialTreeHandler: ApiHandler = async (request: NextRequest) => {
  try {
    // 查询所有材质分组，按order排序
    const materialGroups = await prisma.materialGroups.findMany({
      orderBy: { order: 'asc' }
    })

    // 查询所有材质（使用关联查询获取类型信息）
    const materials = await prisma.materials.findMany({
      include: {
        type: {
          select: {
            name: true
          }
        }
      }
    })

    // 构建分组映射
    const groupMap = new Map<string, MaterialGroupNode>()
    const rootGroups: (MaterialGroupNode | MaterialNode)[] = []

    // 初始化所有分组节点
    materialGroups.forEach(group => {
      const groupNode: MaterialGroupNode = {
        name: group.name,
        id: group.id,
        parent_id: group.parent_id,
        order: group.order,
        children: []
      }
      groupMap.set(group.id, groupNode)
    })

    // 构建分组树结构
    materialGroups.forEach(group => {
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

    // 将材质添加到对应的分组中
    materials.forEach(material => {
      const materialNode: MaterialNode = {
        id: material.id,
        name: material.name,
        type_id: material.type_id,
        group_id: material.group_id,
        type: material.type.name
      }

      if (material.group_id) {
        const groupNode = groupMap.get(material.group_id)
        if (groupNode) {
          groupNode.children!.push(materialNode)
        }
      } else {
        // 如果材质没有分组，添加到根级别
        rootGroups.push(materialNode)
      }
    })

    // 递归排序子节点 - 只按order排序
    const sortChildren = (node: MaterialGroupNode) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          // 分组优先于材质
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
            sortChildren(child as MaterialGroupNode)
          }
        })
      }
    }

    // 对根级别排序
    rootGroups.sort((a, b) => {
      // 分组优先于材质
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
        sortChildren(node as MaterialGroupNode)
      }
    })

    return createSuccessResponse(
      rootGroups,
      'Material tree data retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve material tree data:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve material tree data',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getMaterialTreeHandler)
