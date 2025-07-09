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
 * /api/client/project/categories/tree:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取项目分类树形结构
 *     description: 按照分类层级返回树状项目分类数据
 *     responses:
 *       200:
 *         description: 项目分类树状数据获取成功
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
 *                   example: "Project category tree data retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectCategoryNode'
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
 *                   example: "Failed to retrieve project category tree data"
 *                 error:
 *                   type: object
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 *     components:
 *       schemas:
 *         ProjectCategoryNode:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: 分类ID
 *               example: 1
 *             name:
 *               type: string
 *               description: 分类名称
 *               example: "Web开发"
 *             slug:
 *               type: string
 *               description: URL友好的分类别名
 *               example: "web-development"
 *             description:
 *               type: string
 *               nullable: true
 *               description: 分类描述
 *               example: "Web应用程序开发相关项目"
 *             parent_id:
 *               type: integer
 *               nullable: true
 *               description: 父分类ID
 *               example: null
 *             order:
 *               type: integer
 *               description: 排序顺序
 *               example: 1
 *             children:
 *               type: array
 *               description: 子分类列表
 *               items:
 *                 $ref: '#/components/schemas/ProjectCategoryNode'
 */

interface ProjectCategoryNode {
  id: number
  name: string
  slug: string
  description: string | null
  parent_id: number | null
  order: number
  children?: ProjectCategoryNode[]
}

const getProjectCategoryTreeHandler: ApiHandler = async (
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

    // 构建分类映射
    const categoryMap = new Map<number, ProjectCategoryNode>()
    const rootCategories: ProjectCategoryNode[] = []

    // 初始化所有分类节点
    categories.forEach(category => {
      const categoryNode: ProjectCategoryNode = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent_id: category.parent_id,
        order: category.order,
        children: []
      }
      categoryMap.set(category.id, categoryNode)
    })

    // 构建分类树结构
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!
      if (category.parent_id) {
        const parentNode = categoryMap.get(category.parent_id)
        if (parentNode) {
          parentNode.children!.push(categoryNode)
        }
      } else {
        // 根级分类
        rootCategories.push(categoryNode)
      }
    })

    // 递归排序子节点
    const sortChildren = (node: ProjectCategoryNode) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => a.order - b.order)

        // 递归排序子分类
        node.children.forEach(child => {
          sortChildren(child)
        })
      }
    }

    // 排序根级分类并递归排序所有子级别
    rootCategories.sort((a, b) => a.order - b.order)
    rootCategories.forEach(category => {
      sortChildren(category)
    })

    // 清理空的 children 数组（可选）
    const cleanEmptyChildren = (node: ProjectCategoryNode) => {
      if (node.children && node.children.length === 0) {
        delete node.children
      } else if (node.children) {
        node.children.forEach(child => cleanEmptyChildren(child))
      }
    }

    rootCategories.forEach(category => {
      cleanEmptyChildren(category)
    })

    return createSuccessResponse(
      rootCategories,
      'Project category tree data retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve project category tree data:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve project category tree data',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getProjectCategoryTreeHandler)
