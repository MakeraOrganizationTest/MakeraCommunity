import { NextRequest } from 'next/server'
import {
  withApiHandler,
  withAuthenticatedApiHandler,
  createSuccessResponse,
  createErrorResponse,
  DATA_ERROR
} from '@/lib/server'
import { prisma } from '@/lib/prisma'
import { AUTH_ERROR } from '@/constants/error-codes'
import type { ApiHandler, AuthenticatedApiHandler } from '@/lib/server/types'
import type { User } from '@/types/user'
import { auth0 } from '@/lib/auth0'

// 获取用户对评论的点赞状态
const getUserLikeStatus = async (
  userId: string,
  commentIds: string[]
): Promise<Map<string, boolean>> => {
  if (!userId || commentIds.length === 0) {
    return new Map()
  }

  const likes = await prisma.likes.findMany({
    where: {
      user_id: userId,
      content_type: 'comment',
      content_id: { in: commentIds }
    },
    select: {
      content_id: true
    }
  })

  const likeMap = new Map<string, boolean>()
  commentIds.forEach(id => likeMap.set(id, false))
  likes.forEach(like => likeMap.set(like.content_id, true))

  return likeMap
}

/**
 * @swagger
 * /api/client/project/comment:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取项目评论列表
 *     description: 根据项目ID获取评论列表，支持热门/最新排序，支持分页
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *         required: true
 *         description: 项目ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [hot, new]
 *         description: 排序方式，hot：按点赞数排序，new：按创建时间排序
 *         example: "new"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页条数
 *         example: 10
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *         description: 父评论ID，用于获取回复列表
 *         example: "parent-comment-uuid"
 *     responses:
 *       200:
 *         description: 评论列表获取成功
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
 *                   example: "Comments retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "comment-uuid"
 *                           content:
 *                             type: string
 *                             example: "这是一个很棒的项目！"
 *                           user_id:
 *                             type: string
 *                             example: "user-uuid"
 *                           project_id:
 *                             type: string
 *                             example: "project-uuid"
 *                           parent_id:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["https://example.com/image1.jpg"]
 *                           likes_count:
 *                             type: integer
 *                             example: 5
 *                           is_liked:
 *                             type: boolean
 *                             description: 当前用户是否点赞了该评论（仅登录用户返回）
 *                             example: true
 *                           visibility:
 *                             type: string
 *                             example: "public"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00.000Z"
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "user-uuid"
 *                               nick_name:
 *                                 type: string
 *                                 example: "张三"
 *                               picture:
 *                                 type: string
 *                                 example: "https://example.com/avatar.jpg"
 *                           replies:
 *                             type: array
 *                             items:
 *                               type: object
 *                             description: 回复评论列表（仅顶级评论包含）
 *                           replies_count:
 *                             type: integer
 *                             example: 3
 *                             description: 回复数量
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         has_next:
 *                           type: boolean
 *                           example: true
 *   post:
 *     tags:
 *       - Client
 *     summary: 创建评论
 *     description: 为指定项目创建评论或回复
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - content
 *             properties:
 *               project_id:
 *                 type: string
 *                 description: 项目ID
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               content:
 *                 type: string
 *                 description: 评论内容
 *                 example: "这是一个很棒的项目！"
 *               parent_id:
 *                 type: string
 *                 description: 父评论ID（回复时需要）
 *                 example: "parent-comment-uuid"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 评论图片路径数组
 *                 example: ["https://example.com/image1.jpg"]
 *     responses:
 *       201:
 *         description: 评论创建成功
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
 *                   example: "Comment created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "comment-uuid"
 *                     content:
 *                       type: string
 *                       example: "这是一个很棒的项目！"
 *                     user_id:
 *                       type: string
 *                       example: "user-uuid"
 *                     project_id:
 *                       type: string
 *                       example: "project-uuid"
 *                     parent_id:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["https://example.com/image1.jpg"]
 *                     likes_count:
 *                       type: integer
 *                       example: 0
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T10:30:00.000Z"
 *   put:
 *     tags:
 *       - Client
 *     summary: 更新评论
 *     description: 更新指定评论的内容
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - content
 *             properties:
 *               id:
 *                 type: string
 *                 description: 评论ID
 *                 example: "comment-uuid"
 *               content:
 *                 type: string
 *                 description: 评论内容
 *                 example: "这是一个很棒的项目！（已编辑）"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 评论图片路径数组
 *                 example: ["https://example.com/image1.jpg"]
 *     responses:
 *       200:
 *         description: 评论更新成功
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
 *                   example: "Comment updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "comment-uuid"
 *                     content:
 *                       type: string
 *                       example: "这是一个很棒的项目！（已编辑）"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["https://example.com/image1.jpg"]
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T10:30:00.000Z"
 *   delete:
 *     tags:
 *       - Client
 *     summary: 删除评论
 *     description: 删除指定的评论（软删除）
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 评论ID
 *         example: "comment-uuid"
 *     responses:
 *       200:
 *         description: 评论删除成功
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
 *                   example: "Comment deleted successfully"
 */

// GET - 获取评论列表
const getCommentsHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')
  const sort = searchParams.get('sort') || 'new'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
  const parentId = searchParams.get('parent_id')

  // 验证用户身份 - 获取 Auth0 session
  const session = await auth0.getSession()
  let currentUser: User | null = null

  if (session?.user) {
    // 从数据库获取完整的用户信息
    currentUser = await prisma.users.findUnique({
      where: {
        auth0_id: session.user.sub
      }
    })
  }

  if (!projectId) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Project ID is required',
      null,
      400
    )
  }

  if (!['hot', 'new'].includes(sort)) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Sort must be either "hot" or "new"',
      null,
      400
    )
  }

  try {
    // 验证项目是否存在
    const project = await prisma.projects.findUnique({
      where: { id: projectId, is_deleted: false }
    })

    if (!project) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Project not found',
        null,
        404
      )
    }

    // Fallback: 使用 Prisma 分层查询（如果 CTE 失败）
    const getAllRepliesWithPrisma = async (
      parentCommentId: string
    ): Promise<any[]> => {
      const allReplies: any[] = []
      const processedIds = new Set<string>()

      const getReplyLayer = async (
        parentIds: string[],
        depth = 0
      ): Promise<void> => {
        if (parentIds.length === 0 || depth > 10) return

        const layerReplies = await prisma.projectComments.findMany({
          where: {
            parent_id: { in: parentIds },
            is_deleted: false,
            visibility: 'public'
          },
          orderBy: { created_at: 'asc' },
          select: {
            id: true,
            content: true,
            user_id: true,
            project_id: true,
            parent_id: true,
            images: true,
            likes_count: true,
            visibility: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                id: true,
                nick_name: true,
                picture: true
              }
            },
            parent: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    nick_name: true,
                    picture: true
                  }
                }
              }
            }
          }
        })

        const replyGroups = new Map<string, any[]>()
        layerReplies.forEach(reply => {
          if (!processedIds.has(reply.id)) {
            const parentId = reply.parent_id!
            if (!replyGroups.has(parentId)) {
              replyGroups.set(parentId, [])
            }
            replyGroups.get(parentId)!.push(reply)
            processedIds.add(reply.id)
          }
        })

        parentIds.forEach(parentId => {
          const replies = replyGroups.get(parentId) || []
          allReplies.push(...replies)
        })

        const nextLayerIds = layerReplies.map(reply => reply.id)
        if (nextLayerIds.length > 0) {
          await getReplyLayer(nextLayerIds, depth + 1)
        }
      }

      await getReplyLayer([parentCommentId])
      return allReplies
    }

    // 使用 CTE 递归查询获取所有层级的回复
    const getAllRepliesWithCTE = async (parentCommentId: string) => {
      const result = await prisma.$queryRaw`
        WITH RECURSIVE comment_tree AS (
          -- 基础查询：获取直接子评论
          SELECT 
            c.id,
            c.content,
            c.user_id,
            c.project_id,
            c.parent_id,
            c.images,
            c.likes_count,
            c.visibility,
            c.created_at,
            c.updated_at,
            u.nick_name as user_nick_name,
            u.picture as user_picture,
            pu.id as parent_user_id,
            pu.nick_name as parent_user_nick_name,
            pu.picture as parent_user_picture,
            0 as depth,
            c.created_at as sort_key
          FROM project_comments c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN project_comments pc ON c.parent_id = pc.id
          LEFT JOIN users pu ON pc.user_id = pu.id
          WHERE c.parent_id = CAST(${parentCommentId} AS uuid)
            AND c.is_deleted = false
            AND c.visibility = 'public'
          
          UNION ALL
          
          -- 递归查询：获取子评论的子评论
          SELECT 
            c.id,
            c.content,
            c.user_id,
            c.project_id,
            c.parent_id,
            c.images,
            c.likes_count,
            c.visibility,
            c.created_at,
            c.updated_at,
            u.nick_name as user_nick_name,
            u.picture as user_picture,
            pu.id as parent_user_id,
            pu.nick_name as parent_user_nick_name,
            pu.picture as parent_user_picture,
            ct.depth + 1 as depth,
            ct.sort_key
          FROM project_comments c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN project_comments pc ON c.parent_id = pc.id
          LEFT JOIN users pu ON pc.user_id = pu.id
          JOIN comment_tree ct ON c.parent_id = ct.id
          WHERE c.is_deleted = false
            AND c.visibility = 'public'
            AND ct.depth < 10  -- 限制最大深度防止无限递归
        )
        SELECT * FROM comment_tree
        ORDER BY sort_key ASC, depth ASC, created_at ASC
      `

      // 转换查询结果为标准格式
      return (result as any[]).map(row => ({
        id: row.id,
        content: row.content,
        user_id: row.user_id,
        project_id: row.project_id,
        parent_id: row.parent_id,
        images: row.images,
        likes_count: row.likes_count,
        visibility: row.visibility,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: row.user_id,
          nick_name: row.user_nick_name,
          picture: row.user_picture
        },
        parent: row.parent_user_id
          ? {
              id: row.parent_id,
              user: {
                id: row.parent_user_id,
                nick_name: row.parent_user_nick_name,
                picture: row.parent_user_picture
              }
            }
          : null
      }))
    }

    if (parentId) {
      // 首先检查父评论是否存在且未被删除
      const parentComment = await prisma.projectComments.findUnique({
        where: {
          id: parentId,
          is_deleted: false,
          visibility: 'public'
        }
      })

      if (!parentComment) {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Parent comment not found or has been deleted',
          null,
          404
        )
      }

      // 获取指定评论的回复列表（用于"加载更多回复"）
      let allReplies: any[] = []
      try {
        allReplies = await getAllRepliesWithCTE(parentId)
      } catch (error) {
        console.warn(
          'CTE query failed for parent replies, using Prisma fallback:',
          error
        )
        allReplies = await getAllRepliesWithPrisma(parentId)
      }

      // 分页处理
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedReplies = allReplies.slice(startIndex, endIndex)

      // 如果用户已登录，获取点赞状态
      let likeStatusMap = new Map<string, boolean>()
      if (currentUser) {
        const replyIds = paginatedReplies.map(reply => reply.id)
        likeStatusMap = await getUserLikeStatus(currentUser.id, replyIds)
      }

      // 为每条回复添加点赞状态
      const repliesWithLikeStatus = paginatedReplies.map(reply => ({
        ...reply,
        is_liked: currentUser ? likeStatusMap.get(reply.id) || false : undefined
      }))

      const pagination = {
        page,
        limit,
        total: allReplies.length,
        has_next: endIndex < allReplies.length
      }

      return createSuccessResponse(
        {
          comments: repliesWithLikeStatus,
          pagination
        },
        'Comments retrieved successfully'
      )
    } else {
      // 获取主评论列表 - 使用批量查询优化
      const where = {
        project_id: projectId,
        is_deleted: false,
        visibility: 'public' as const,
        parent_id: null
      }

      // 构建排序条件
      const orderBy =
        sort === 'hot'
          ? [{ likes_count: 'desc' as const }, { created_at: 'desc' as const }]
          : [{ created_at: 'desc' as const }]

      // 批量查询：主评论 + 总数
      const [comments, total] = await Promise.all([
        prisma.projectComments.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            content: true,
            user_id: true,
            project_id: true,
            parent_id: true,
            images: true,
            likes_count: true,
            visibility: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                id: true,
                nick_name: true,
                picture: true
              }
            }
          }
        }),
        prisma.projectComments.count({ where })
      ])

      // 批量获取所有主评论的回复
      const commentIds = comments.map(c => c.id)
      const allRepliesMap = new Map<string, any[]>()

      // 并行查询所有主评论的回复 - 使用 CTE 优先，失败则使用 Prisma fallback
      const repliesPromises = commentIds.map(async commentId => {
        try {
          const replies = await getAllRepliesWithCTE(commentId)
          allRepliesMap.set(commentId, replies)
        } catch (error) {
          console.warn(
            `CTE query failed for comment ${commentId}, using Prisma fallback:`,
            error
          )
          try {
            const replies = await getAllRepliesWithPrisma(commentId)
            allRepliesMap.set(commentId, replies)
          } catch (fallbackError) {
            console.error(
              `Both CTE and Prisma queries failed for comment ${commentId}:`,
              fallbackError
            )
            allRepliesMap.set(commentId, [])
          }
        }
      })

      await Promise.all(repliesPromises)

      // 如果用户已登录，获取点赞状态
      let likeStatusMap = new Map<string, boolean>()
      if (currentUser) {
        // 收集所有评论ID（主评论 + 所有回复）
        const allCommentIds = [...commentIds]
        allRepliesMap.forEach(replies => {
          allCommentIds.push(...replies.map(reply => reply.id))
        })

        likeStatusMap = await getUserLikeStatus(currentUser.id, allCommentIds)
      }

      // 组装最终数据
      const formattedComments = comments.map(comment => {
        const allReplies = allRepliesMap.get(comment.id) || []

        // 为回复添加点赞状态
        const repliesWithLikeStatus = allReplies.slice(0, 3).map(reply => ({
          ...reply,
          is_liked: currentUser
            ? likeStatusMap.get(reply.id) || false
            : undefined
        }))

        return {
          ...comment,
          is_liked: currentUser
            ? likeStatusMap.get(comment.id) || false
            : undefined,
          replies: repliesWithLikeStatus,
          replies_count: allReplies.length
        }
      })

      const pagination = {
        page,
        limit,
        total,
        has_next: page * limit < total
      }

      return createSuccessResponse(
        {
          comments: formattedComments,
          pagination
        },
        'Comments retrieved successfully'
      )
    }
  } catch (error) {
    console.error('Failed to retrieve comments:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve comments',
      error,
      500
    )
  }
}

// POST - 创建评论
const createCommentHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const { project_id, content, parent_id, images } = body

    // 验证必填字段
    if (!project_id || !content) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'project_id and content are required',
        null,
        400
      )
    }

    // 验证项目是否存在
    const project = await prisma.projects.findUnique({
      where: { id: project_id, is_deleted: false }
    })

    if (!project) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Project not found',
        null,
        404
      )
    }

    // 如果是回复，验证父评论是否存在
    if (parent_id) {
      const parentComment = await prisma.projectComments.findUnique({
        where: { id: parent_id, is_deleted: false }
      })

      if (!parentComment) {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Parent comment not found',
          null,
          404
        )
      }

      if (parentComment.project_id !== project_id) {
        return createErrorResponse(
          DATA_ERROR.VALIDATION_FAILED,
          'Parent comment does not belong to this project',
          null,
          400
        )
      }
    }

    // 创建评论
    const comment = await prisma.projectComments.create({
      data: {
        content,
        user_id: user.id,
        project_id,
        parent_id,
        images: images || []
      },
      select: {
        id: true,
        content: true,
        user_id: true,
        project_id: true,
        parent_id: true,
        images: true,
        likes_count: true,
        visibility: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id: true,
            nick_name: true,
            picture: true
          }
        },
        parent: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                nick_name: true,
                picture: true
              }
            }
          }
        }
      }
    })

    return createSuccessResponse(comment, 'Comment created successfully')
  } catch (error) {
    console.error('Failed to create comment:', error)
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create comment',
      error,
      500
    )
  }
}

// PUT - 更新评论
const updateCommentHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const { id, content, images } = body

    // 验证必填字段
    if (!id || !content) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'Comment ID and content are required',
        null,
        400
      )
    }

    // 验证评论是否存在且用户有权限
    const comment = await prisma.projectComments.findUnique({
      where: { id, is_deleted: false }
    })

    if (!comment) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Comment not found',
        null,
        404
      )
    }

    if (comment.user_id !== user.id) {
      return createErrorResponse(
        AUTH_ERROR.FORBIDDEN,
        'You do not have permission to update this comment',
        null,
        403
      )
    }

    // 更新评论
    const updatedComment = await prisma.projectComments.update({
      where: { id },
      data: {
        content,
        images: images || comment.images,
        updated_at: new Date()
      },
      select: {
        id: true,
        content: true,
        user_id: true,
        project_id: true,
        parent_id: true,
        images: true,
        likes_count: true,
        visibility: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id: true,
            nick_name: true,
            picture: true
          }
        },
        parent: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                nick_name: true,
                picture: true
              }
            }
          }
        }
      }
    })

    return createSuccessResponse(updatedComment, 'Comment updated successfully')
  } catch (error) {
    console.error('Failed to update comment:', error)
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to update comment',
      error,
      500
    )
  }
}

// DELETE - 删除评论（软删除）
const deleteCommentHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('id')

  if (!commentId) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Comment ID is required',
      null,
      400
    )
  }

  try {
    // 验证评论是否存在且用户有权限
    const comment = await prisma.projectComments.findUnique({
      where: { id: commentId, is_deleted: false }
    })

    if (!comment) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Comment not found',
        null,
        404
      )
    }

    if (comment.user_id !== user.id) {
      return createErrorResponse(
        AUTH_ERROR.FORBIDDEN,
        'You do not have permission to delete this comment',
        null,
        403
      )
    }

    // 递归删除评论及其所有子评论
    const deleteCommentRecursive = async (
      parentId: string,
      currentDate: Date
    ): Promise<void> => {
      // 获取所有直接子评论
      const childComments = await prisma.projectComments.findMany({
        where: {
          parent_id: parentId,
          is_deleted: false
        },
        select: {
          id: true
        }
      })

      // 递归删除每个子评论
      for (const childComment of childComments) {
        await deleteCommentRecursive(childComment.id, currentDate)
      }

      // 删除当前评论
      await prisma.projectComments.update({
        where: { id: parentId },
        data: {
          is_deleted: true,
          deleted_at: currentDate
        }
      })
    }

    const deletedAt = new Date()
    await deleteCommentRecursive(commentId, deletedAt)

    return createSuccessResponse(null, 'Comment deleted successfully')
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return createErrorResponse(
      DATA_ERROR.DELETE_FAILED,
      'Failed to delete comment',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getCommentsHandler)
export const POST = withAuthenticatedApiHandler(createCommentHandler)
export const PUT = withAuthenticatedApiHandler(updateCommentHandler)
export const DELETE = withAuthenticatedApiHandler(deleteCommentHandler)
