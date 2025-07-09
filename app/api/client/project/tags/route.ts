import { NextRequest } from 'next/server'
import {
  withApiHandler,
  withAuthenticatedApiHandler,
  createSuccessResponse,
  createErrorResponse,
  DATA_ERROR
} from '@/lib/server'
import { prisma } from '@/lib/prisma'
import type { ApiHandler, AuthenticatedApiHandler } from '@/lib/server/types'
import type { User } from '@/types/user'

/**
 * @swagger
 * /api/client/project/tags:
 *   get:
 *     tags:
 *       - Client
 *     summary: 模糊匹配查询标签
 *     description: 根据标签名称进行模糊匹配查询
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: 标签名称关键词，支持模糊匹配
 *         example: "木工"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         required: false
 *         description: 返回结果数量限制
 *         example: 10
 *     responses:
 *       200:
 *         description: 标签查询成功
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
 *                   example: "Tags retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "木工制作"
 *   post:
 *     tags:
 *       - Client
 *     summary: 新增标签
 *     description: 创建新的标签
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *                 example: "木工制作"
 *     responses:
 *       201:
 *         description: 标签创建成功
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
 *                   example: "Tag created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "木工制作"
 *                     created_by:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T10:30:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T10:30:00.000Z"
 */

// GET - 模糊匹配查询标签
const getTagsHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  try {
    // 构建查询条件
    const whereCondition = name
      ? {
          name: {
            contains: name,
            mode: 'insensitive' as const
          }
        }
      : {}

    // 查询标签，仅返回 id 和 name 字段
    const tags = await prisma.tag.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true
      },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100) // 限制最大返回数量
    })

    return createSuccessResponse(tags, 'Tags retrieved successfully')
  } catch (error) {
    console.error('Failed to retrieve tags:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve tags',
      error,
      500
    )
  }
}

// POST - 新增标签
const createTagHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const { name } = body

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'Tag name is required and must be a non-empty string',
        null,
        400
      )
    }

    const trimmedName = name.trim()

    // 验证标签名称长度
    if (trimmedName.length > 50) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'Tag name must be less than 50 characters',
        null,
        400
      )
    }

    // 检查标签是否已存在
    const existingTag = await prisma.tag.findUnique({
      where: { name: trimmedName }
    })

    if (existingTag) {
      return createErrorResponse(
        DATA_ERROR.DUPLICATE_ENTRY,
        'Tag with this name already exists',
        null,
        409
      )
    }

    // 创建新标签
    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
        created_by: user.id
      }
    })

    return createSuccessResponse(tag, 'Tag created successfully')
  } catch (error) {
    console.error('Failed to create tag:', error)
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create tag',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getTagsHandler)
export const POST = withAuthenticatedApiHandler(createTagHandler)
