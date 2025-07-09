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
 * /api/client/material/types:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取材质类型列表
 *     description: 查询所有材质类型的基本信息
 *     responses:
 *       200:
 *         description: 材质类型列表获取成功
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
 *                   example: "Material types retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 材质类型ID
 *                         example: "type-uuid"
 *                       name:
 *                         type: string
 *                         description: 材质类型名称
 *                         example: "实木"
 *                       code:
 *                         type: string
 *                         description: 材质类型代码
 *                         example: "WOOD"
 *                       is_metal:
 *                         type: boolean
 *                         description: 是否为金属材质
 *                         example: false
 *                 timestamp:
 *                   type: integer
 *       500:
 *         description: 服务器内部错误
 */

const getMaterialTypesHandler: ApiHandler = async (request: NextRequest) => {
  try {
    // 查询所有材质类型，只返回基本字段
    const materialTypes = await prisma.materialTypes.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return createSuccessResponse(
      materialTypes,
      'Material types retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve material types:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve material types',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getMaterialTypesHandler)
