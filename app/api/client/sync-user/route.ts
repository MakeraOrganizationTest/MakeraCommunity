import { NextRequest, NextResponse } from 'next/server'
import {
  withApiHandler,
  createSuccessResponse,
  createErrorResponse
} from '@/lib/server'
import { USER_ERROR, COMMON_ERROR } from '@/constants/error-codes'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 常量定义
const LOGIN_TIME_UPDATE_INTERVAL = 5 * 60 * 1000 // 5分钟，可配置
const DEFAULT_USER_ROLE = 'user'

// 用户同步数据验证 schema
const syncUserSchema = z.object({
  auth0_id: z.string().min(1, 'Auth0 ID is required'),
  full_name: z.string().optional().nullable(),
  nick_name: z.string().optional().nullable(),
  user_name: z.string().optional().nullable(),
  picture: z.string().url().optional().nullable().or(z.literal('')),
  email: z.string().email().optional().nullable(),
  email_verified: z.boolean().optional().nullable()
})

// 用户数据变化检查函数
function hasUserDataChanged(existingUser: any, validatedData: any): boolean {
  return (
    existingUser.full_name !== validatedData.full_name ||
    existingUser.nick_name !== validatedData.nick_name ||
    existingUser.user_name !== validatedData.user_name ||
    existingUser.picture !== validatedData.picture ||
    existingUser.email !== validatedData.email ||
    existingUser.email_verified !== validatedData.email_verified
  )
}

// 检查是否需要更新登录时间
function shouldUpdateLoginTime(lastLogin: Date | null): boolean {
  if (!lastLogin) return true
  const now = new Date()
  return now.getTime() - lastLogin.getTime() > LOGIN_TIME_UPDATE_INTERVAL
}

/**
 * @swagger
 * /api/client/sync-user:
 *   post:
 *     summary: 同步 Auth0 用户数据
 *     description: 同步 Auth0 用户数据到本地数据库，如果用户不存在则创建新用户并分配默认角色，如果用户存在则更新用户信息
 *     tags:
 *       - User Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auth0_id
 *             properties:
 *               auth0_id:
 *                 type: string
 *                 description: Auth0 用户唯一标识
 *                 example: "auth0|123456789abcdef"
 *               full_name:
 *                 type: string
 *                 nullable: true
 *                 description: 用户全名
 *                 example: "张三"
 *               nick_name:
 *                 type: string
 *                 nullable: true
 *                 description: 用户昵称
 *                 example: "zhangsan"
 *               user_name:
 *                 type: string
 *                 nullable: true
 *                 description: 用户名
 *                 example: "zhangsan123"
 *               picture:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: 用户头像 URL
 *                 example: "https://s.gravatar.com/avatar/123456.jpg"
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: 用户邮箱
 *                 example: "zhangsan@example.com"
 *               email_verified:
 *                 type: boolean
 *                 nullable: true
 *                 description: 邮箱是否已验证
 *                 example: true
 *     responses:
 *       200:
 *         description: 用户同步成功
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
 *                   example: "User synchronized successfully"
 *                 data:
 *                   type: null
 *                   example: null
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
 *                   example: "Invalid user data provided"
 *                 error:
 *                   type: object
 *                   description: 详细的验证错误信息
 *       409:
 *         description: 用户已存在冲突
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
 *                   example: "User with this Auth0 ID already exists"
 *                 error:
 *                   type: object
 *                   description: 详细的错误信息
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
 *                   example: "Failed to synchronize user data"
 *                 error:
 *                   type: object
 *                   description: 详细的错误信息
 */
async function handler(req: NextRequest): Promise<NextResponse> {
  try {
    // 解析请求体
    const body = await req.json()

    // 验证请求数据
    const validatedData = syncUserSchema.parse(body)

    console.log(`Syncing user: ${validatedData.auth0_id}`)

    // 使用 findUnique 查询（auth0_id 已有唯一索引）
    const existingUser = await prisma.users.findUnique({
      where: {
        auth0_id: validatedData.auth0_id
      }
    })

    let user
    if (existingUser) {
      // 检查是否需要更新用户信息
      const needsUpdate = hasUserDataChanged(existingUser, validatedData)

      if (needsUpdate) {
        // 只有数据有变化时才更新
        console.log(`Updating user data for: ${validatedData.auth0_id}`)
        user = await prisma.users.update({
          where: {
            id: existingUser.id
          },
          data: {
            full_name: validatedData.full_name,
            nick_name: validatedData.nick_name,
            user_name: validatedData.user_name,
            picture: validatedData.picture,
            email: validatedData.email,
            email_verified: validatedData.email_verified,
            last_login_at: new Date(),
            updated_at: new Date()
          }
        })
      } else if (shouldUpdateLoginTime(existingUser.last_login_at)) {
        // 数据没有变化，但需要更新登录时间
        console.log(`Updating login time for: ${validatedData.auth0_id}`)
        user = await prisma.users.update({
          where: {
            id: existingUser.id
          },
          data: {
            last_login_at: new Date()
          }
        })
      } else {
        // 完全无需更新，直接使用现有用户数据
        console.log(`No update needed for: ${validatedData.auth0_id}`)
        user = existingUser
      }
    } else {
      // 创建新用户（使用事务确保原子性）
      console.log(`Creating new user: ${validatedData.auth0_id}`)
      user = await prisma.$transaction(async tx => {
        // 1. 双重检查：在事务中再次确认用户不存在（防止并发竞争）
        const existingInTransaction = await tx.users.findUnique({
          where: { auth0_id: validatedData.auth0_id }
        })

        if (existingInTransaction) {
          console.log(
            `User already exists during transaction: ${validatedData.auth0_id}`
          )
          throw new Error(
            `User with auth0_id ${validatedData.auth0_id} already exists`
          )
        }

        // 2. 创建用户
        const newUser = await tx.users.create({
          data: {
            auth0_id: validatedData.auth0_id,
            full_name: validatedData.full_name,
            nick_name: validatedData.nick_name,
            user_name: validatedData.user_name,
            picture: validatedData.picture,
            email: validatedData.email,
            email_verified: validatedData.email_verified,
            last_login_at: new Date(),
            status: 'active'
          }
        })

        // 3. 查找默认的 user 角色
        const userRole = await tx.roles.findFirst({
          where: { name: DEFAULT_USER_ROLE }
        })

        if (userRole) {
          // 4. 为新用户分配默认角色
          await tx.userRoles.create({
            data: {
              user_id: newUser.id,
              role_id: userRole.id
            }
          })
          console.log(
            `Assigned default role to new user: ${validatedData.auth0_id}`
          )
        } else {
          console.warn(`Default role '${DEFAULT_USER_ROLE}' not found`)
        }

        // 5. 返回创建的用户
        return newUser
      })
    }

    // 确保用户数据存在
    if (!user) {
      console.error(`Failed to sync user: ${validatedData.auth0_id}`)
      return createErrorResponse(
        USER_ERROR.CREATE_FAILED,
        'Failed to create or update user',
        null,
        500
      )
    }

    console.log(`User synchronized successfully: ${validatedData.auth0_id}`)
    return createSuccessResponse(null, 'User synchronized successfully')
  } catch (error) {
    console.error('Failed to sync user:', error)

    // 处理 Zod 验证错误
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        COMMON_ERROR.VALIDATION_ERROR,
        'Invalid user data provided',
        error.errors,
        400
      )
    }

    // 处理 Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
      // Prisma 数据库约束错误
      if (error.code === 'P2002') {
        const target = (error as any).meta?.target
        if (target?.includes('auth0_id')) {
          return createErrorResponse(
            USER_ERROR.CREATE_FAILED,
            'User with this Auth0 ID already exists',
            error,
            409
          )
        }
        return createErrorResponse(
          USER_ERROR.CREATE_FAILED,
          'User with this information already exists',
          error,
          409
        )
      }
    }

    // 处理其他数据库错误
    return createErrorResponse(
      USER_ERROR.SYNC_FAILED,
      'Failed to synchronize user data',
      error,
      500
    )
  }
}

// 导出使用中间件包装后的处理函数
export const POST = withApiHandler(handler)
