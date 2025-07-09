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
 * /api/client/project/categories:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取项目分类列表
 *     description: 查询所有激活状态的项目分类信息
 *     responses:
 *       200:
 *         description: 项目分类列表获取成功
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
 *                   example: "Project categories retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 分类ID
 *                         example: 1
 *                       name:
 *                         type: string
 *                         description: 分类名称
 *                         example: "Web开发"
 *                       slug:
 *                         type: string
 *                         description: URL友好的分类别名
 *                         example: "web-development"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         description: 分类描述
 *                         example: "Web应用程序开发相关项目"
 *                       parent_id:
 *                         type: integer
 *                         nullable: true
 *                         description: 父分类ID
 *                         example: null
 *                       order:
 *                         type: integer
 *                         description: 排序顺序
 *                         example: 1
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
 *                   example: "Failed to retrieve project categories"
 *                 error:
 *                   type: object
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 */

const getProjectCategoriesHandler: ApiHandler = async (
  request: NextRequest
) => {
  try {
    // 查询所有激活状态的项目分类，按order排序
    const categories = await prisma.projectCategories.findMany({
      where: {
        is_active: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parent_id: true,
        order: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return createSuccessResponse(
      categories,
      'Project categories retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve project categories:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve project categories',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getProjectCategoriesHandler)
