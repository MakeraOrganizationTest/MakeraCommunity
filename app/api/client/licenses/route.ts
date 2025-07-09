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
 * /api/client/licenses:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取许可证列表
 *     description: 查询所有激活状态的许可证信息
 *     responses:
 *       200:
 *         description: 许可证列表获取成功
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
 *                   example: "Licenses retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: 许可证唯一标识符
 *                         example: "09ad84dc-05d4-4c8b-9877-df7219d7213c"
 *                       name:
 *                         type: string
 *                         description: 许可证名称
 *                         example: "MIT License"
 *                       code:
 *                         type: string
 *                         description: 许可证代码
 *                         example: "MIT"
 *                       description:
 *                         type: string
 *                         description: 许可证说明
 *                         example: "A short and simple permissive license"
 *                       thumbnail:
 *                         type: string
 *                         nullable: true
 *                         description: 许可证缩略图
 *                         example: "/images/licenses/mit.png"
 *                       link:
 *                         type: string
 *                         nullable: true
 *                         description: 许可证链接
 *                         example: "https://opensource.org/licenses/MIT"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: 创建时间
 *                         example: "2025-01-01T00:00:00.000Z"
 *                 timestamp:
 *                   type: integer
 *                   description: 响应时间戳
 *                   example: 1748933761442
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve licenses"
 *                 error:
 *                   type: object
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 */

const getLicensesHandler: ApiHandler = async (request: NextRequest) => {
  try {
    // 查询所有激活状态的许可证，按名称排序
    const licenses = await prisma.licenses.findMany({
      where: {
        is_active: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        thumbnail: true,
        link: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return createSuccessResponse(licenses, 'Licenses retrieved successfully')
  } catch (error) {
    console.error('Failed to retrieve licenses:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve licenses',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getLicensesHandler)
