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
 * /api/client/cutter/types:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取刀具类型列表
 *     description: 查询所有刀具类型的基本信息
 *     responses:
 *       200:
 *         description: 刀具类型列表获取成功
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
 *                   example: "Cutter types retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 类型ID
 *                         example: "type-uuid"
 *                       name:
 *                         type: string
 *                         description: 类型名称
 *                         example: "平底铣刀"
 *                 timestamp:
 *                   type: integer
 *       500:
 *         description: 服务器内部错误
 */

const getCutterTypesHandler: ApiHandler = async (request: NextRequest) => {
  try {
    // 查询所有刀具类型，只返回id和name字段
    const cutterTypes = await prisma.cutterTypes.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return createSuccessResponse(
      cutterTypes,
      'Cutter types retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve cutter types:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve cutter types',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getCutterTypesHandler)
