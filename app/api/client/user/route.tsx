import { NextRequest } from 'next/server'
import {
  withApiHandler,
  ApiHandler,
  createSuccessResponse,
  createErrorResponse,
  USER_ERROR
} from '@/lib/server'
import { prisma } from '@/lib/prisma'

/**
 * @swagger
 * /api/client/user:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取用户详细信息
 *     description: 根据用户ID或Auth0 ID获取用户的完整信息，包括个人资料和角色信息
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: false
 *         description: 用户ID（UUID格式）
 *         example: "09ad84dc-05d4-4c8b-9877-df7219d7213c"
 *       - in: query
 *         name: auth0_id
 *         schema:
 *           type: string
 *         required: false
 *         description: Auth0用户ID
 *         example: "google-oauth2|111053786409985990661"
 *     responses:
 *       200:
 *         description: 用户信息获取成功
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
 *                   example: "User details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 用户唯一标识
 *                       example: "09ad84dc-05d4-4c8b-9877-df7219d7213c"
 *                     auth0_id:
 *                       type: string
 *                       description: Auth0用户标识
 *                       example: "auth0|6858cc72009f76c90b9c924f"
 *                     full_name:
 *                       type: string
 *                       description: 用户全名
 *                       example: "Isboyjc"
 *                       nullable: true
 *                     nick_name:
 *                       type: string
 *                       description: 用户昵称
 *                       example: "isboyjc"
 *                       nullable: true
 *                     user_name:
 *                       type: string
 *                       description: 用户名
 *                       example: "isboyjc"
 *                       nullable: true
 *                     picture:
 *                       type: string
 *                       description: 用户头像URL
 *                       example: "https://example.com/avatar.jpg"
 *                       nullable: true
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: 邮箱地址
 *                       example: "isboyjc@gmail.com"
 *                       nullable: true
 *                     email_verified:
 *                       type: boolean
 *                       description: 邮箱是否已验证
 *                       example: true
 *                       nullable: true
 *                     bio:
 *                       type: string
 *                       description: 个人简介
 *                       example: "I'm a software engineer"
 *                       nullable: true
 *                     gender:
 *                       type: string
 *                       enum: [male, female, other, prefer_not_to_say]
 *                       description: 性别
 *                       example: "male"
 *                       nullable: true
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       description: 生日
 *                       example: "1990-01-01"
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       enum: [active, pending, restricted, banned, inactive]
 *                       description: 用户状态
 *                       example: "active"
 *                     follower_count:
 *                       type: integer
 *                       description: 关注者数量
 *                       example: 10
 *                       default: 0
 *                     following_count:
 *                       type: integer
 *                       description: 关注数量
 *                       example: 5
 *                       default: 0
 *                     is_deleted:
 *                       type: boolean
 *                       description: 是否已删除
 *                       example: false
 *                       default: false
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                       description: 删除时间
 *                       example: "2025-06-03T06:53:37.525Z"
 *                       nullable: true
 *                     last_login_at:
 *                       type: string
 *                       format: date-time
 *                       description: 最后登录时间
 *                       example: "2025-06-03T06:53:37.525Z"
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: 创建时间
 *                       example: "2025-05-23T03:07:27.198Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: 更新时间
 *                       example: "2025-06-03T06:53:37.525Z"
 *                     roles:
 *                       type: array
 *                       description: 用户角色列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: 角色ID
 *                             example: "1"
 *                           name:
 *                             type: string
 *                             description: 角色名称
 *                             example: "admin"
 *                           is_system:
 *                             type: boolean
 *                             description: 是否为系统角色
 *                             example: true
 *                 timestamp:
 *                   type: integer
 *                   description: 响应时间戳
 *                   example: 1748933761442
 *       400:
 *         description: 请求参数错误
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
 *                   example: "User ID parameter not provided"
 *                 error:
 *                   type: object
 *                   nullable: true
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 *       404:
 *         description: 用户不存在
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
 *                   example: "User does not exist or has been deleted"
 *                 error:
 *                   type: object
 *                   nullable: true
 *                 timestamp:
 *                   type: integer
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
 *                   example: "Failed to retrieve user information"
 *                 error:
 *                   type: object
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 */
const getUserHandler: ApiHandler = async (request: NextRequest) => {
  console.time('Total API time')

  const { searchParams } = new URL(request.url)

  // 检查是否指定了用户ID或Auth0 ID
  const userId = searchParams.get('id')
  const auth0Id = searchParams.get('auth0_id')

  // 如果未指定任何ID，返回错误
  if (!userId && !auth0Id) {
    return createErrorResponse(
      USER_ERROR.NOT_FOUND,
      'User ID or Auth0 ID parameter is required',
      null,
      400
    )
  }

  try {
    // 构建查询条件
    const whereCondition = userId
      ? { id: userId, is_deleted: false }
      : { auth0_id: auth0Id!, is_deleted: false }

    // 查询用户信息，包括关联的角色及权限
    const user = await prisma.users.findFirst({
      where: whereCondition,
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    })

    // 如果用户不存在
    if (!user) {
      return createErrorResponse(
        USER_ERROR.NOT_FOUND,
        'User does not exist or has been deleted'
      )
    }

    // 提取角色和权限信息，简化响应结构
    const roles = user.user_roles
      ? user.user_roles.map(ur => {
          return {
            id: String(ur.role.id),
            name: ur.role.name,
            is_system: ur.role.is_system
          }
        })
      : []

    // 构建响应数据
    const userData = {
      id: String(user.id),
      auth0_id: user.auth0_id,
      full_name: user.full_name,
      nick_name: user.nick_name,
      user_name: user.user_name,
      picture: user.picture,
      email: user.email,
      email_verified: user.email_verified,
      bio: user.bio,
      gender: user.gender,
      birthday: user.birthday,
      status: user.status,
      follower_count: user.follower_count,
      following_count: user.following_count,
      is_deleted: user.is_deleted,
      deleted_at: user.deleted_at,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: roles
    }

    console.timeEnd('Total API time')
    return createSuccessResponse(
      userData,
      'User details retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve user details:', error)
    return createErrorResponse(
      USER_ERROR.NOT_FOUND,
      'Failed to retrieve user information',
      error
    )
  }
}

export const GET = withApiHandler(getUserHandler)
