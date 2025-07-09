import { NextRequest } from 'next/server'
import {
  withAuthenticatedApiHandler,
  createSuccessResponse,
  createErrorResponse,
  DATA_ERROR,
  AUTH_ERROR
} from '@/lib/server'
import { prisma } from '@/lib/prisma'
import type { AuthenticatedApiHandler } from '@/lib/server/types'
import type { User } from '@/types/user'
import { Prisma } from '@/generated/prisma'

/**
 * @swagger
 * /api/client/project/like:
 *   post:
 *     tags:
 *       - Client
 *     summary: 点赞/取消点赞
 *     description: 对指定内容进行点赞或取消点赞操作，支持项目和评论
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content_type
 *               - content_id
 *             properties:
 *               content_type:
 *                 type: string
 *                 enum: [model, comment]
 *                 description: 内容类型
 *                 example: "model"
 *               content_id:
 *                 type: string
 *                 description: 内容ID
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               action:
 *                 type: string
 *                 enum: [like, unlike]
 *                 description: 操作类型，如果不指定则自动切换
 *                 example: "like"
 *     responses:
 *       200:
 *         description: 操作成功
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
 *                   example: "Like added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                       example: true
 *                     like_count:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 内容不存在
 *       500:
 *         description: 服务器内部错误
 */

// 验证内容是否存在
const validateContent = async (contentType: string, contentId: string) => {
  switch (contentType) {
    case 'model':
      const project = await prisma.projects.findUnique({
        where: { id: contentId, is_deleted: false }
      })
      return { exists: !!project, data: project }

    case 'comment':
      const comment = await prisma.projectComments.findUnique({
        where: { id: contentId, is_deleted: false }
      })
      return { exists: !!comment, data: comment }

    default:
      return { exists: false, data: null }
  }
}

// 更新点赞计数
const updateLikeCount = async (
  tx: Prisma.TransactionClient,
  contentType: string,
  contentId: string,
  increment: number
) => {
  switch (contentType) {
    case 'model':
      const updatedProject = await tx.projects.update({
        where: { id: contentId },
        data: { likes_count: { increment } },
        select: { likes_count: true }
      })
      return updatedProject.likes_count

    case 'comment':
      const updatedComment = await tx.projectComments.update({
        where: { id: contentId },
        data: { likes_count: { increment } },
        select: { likes_count: true }
      })
      return updatedComment.likes_count

    default:
      return 0
  }
}

// POST - 点赞/取消点赞
const likeHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const { content_type, content_id, action } = body

    // 验证必填字段
    if (!content_type || !content_id) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'content_type and content_id are required',
        null,
        400
      )
    }

    // 验证内容类型
    if (!['model', 'comment'].includes(content_type)) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'content_type must be either "model" or "comment"',
        null,
        400
      )
    }

    // 验证操作类型（如果提供了）
    if (action && !['like', 'unlike'].includes(action)) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'action must be either "like" or "unlike"',
        null,
        400
      )
    }

    // 验证内容是否存在
    const { exists, data } = await validateContent(content_type, content_id)
    if (!exists) {
      const errorMessage =
        content_type === 'model' ? 'Project not found' : 'Comment not found'
      return createErrorResponse(DATA_ERROR.NOT_FOUND, errorMessage, null, 404)
    }

    // 使用事务来确保数据一致性
    const result = await prisma.$transaction(async tx => {
      // 检查是否已经点赞
      const existingLike = await tx.likes.findUnique({
        where: {
          user_id_content_type_content_id: {
            user_id: user.id,
            content_type: content_type as 'model' | 'comment',
            content_id: content_id
          }
        }
      })

      let liked = false
      let likeCount = 0

      if (action === 'like') {
        // 强制点赞操作
        if (existingLike) {
          return {
            liked: true,
            like_count: await updateLikeCount(tx, content_type, content_id, 0)
          }
        }

        // 创建点赞记录
        await tx.likes.create({
          data: {
            user_id: user.id,
            content_type: content_type as 'model' | 'comment',
            content_id: content_id
          }
        })

        // 更新点赞计数
        likeCount = await updateLikeCount(tx, content_type, content_id, 1)
        liked = true
      } else if (action === 'unlike') {
        // 强制取消点赞操作
        if (!existingLike) {
          return {
            liked: false,
            like_count: await updateLikeCount(tx, content_type, content_id, 0)
          }
        }

        // 删除点赞记录
        await tx.likes.delete({
          where: { id: existingLike.id }
        })

        // 更新点赞计数
        likeCount = await updateLikeCount(tx, content_type, content_id, -1)
        liked = false
      } else {
        // 自动切换模式
        if (existingLike) {
          // 取消点赞
          await tx.likes.delete({
            where: { id: existingLike.id }
          })
          likeCount = await updateLikeCount(tx, content_type, content_id, -1)
          liked = false
        } else {
          // 添加点赞
          await tx.likes.create({
            data: {
              user_id: user.id,
              content_type: content_type as 'model' | 'comment',
              content_id: content_id
            }
          })
          likeCount = await updateLikeCount(tx, content_type, content_id, 1)
          liked = true
        }
      }

      return { liked, like_count: likeCount }
    })

    // 构建响应消息
    const message = result.liked
      ? 'Like added successfully'
      : 'Like removed successfully'

    return createSuccessResponse(result, message)
  } catch (error) {
    console.error('Failed to process like operation:', error)
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to process like operation',
      error,
      500
    )
  }
}

export const POST = withAuthenticatedApiHandler(likeHandler)
