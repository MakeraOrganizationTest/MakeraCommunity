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
 * /api/client/cutter/groups:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取刀具分组列表
 *     description: 查询所有刀具分组的基本信息
 *     responses:
 *       200:
 *         description: 刀具分组列表获取成功
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
 *                   example: "Cutter groups retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 分组ID
 *                         example: "group-uuid"
 *                       name:
 *                         type: string
 *                         description: 分组名称
 *                         example: "铣刀组"
 *                       parent_id:
 *                         type: string
 *                         description: 父分组ID
 *                         example: "parent-group-uuid"
 *                         nullable: true
 *                       order:
 *                         type: integer
 *                         description: 排序顺序
 *                         example: 1
 *                 timestamp:
 *                   type: integer
 *       500:
 *         description: 服务器内部错误
 */

const getCutterGroupsHandler: ApiHandler = async (request: NextRequest) => {
  try {
    // 查询所有刀具分组，只返回基本字段
    const cutterGroups = await prisma.cutterGroups.findMany({
      select: {
        id: true,
        name: true,
        parent_id: true,
        order: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return createSuccessResponse(
      cutterGroups,
      'Cutter groups retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve cutter groups:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve cutter groups',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getCutterGroupsHandler)
