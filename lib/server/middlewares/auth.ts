import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '../responses/error'
import { AUTH_ERROR } from '@/constants/error-codes'
import { AuthenticatedApiHandler } from '../types'
import { prisma } from '@/lib/prisma'
import { auth0 } from '@/lib/auth0'

/**
 * 带认证的API处理器包装器
 * 自动验证用户身份并将用户信息传递给处理器
 *
 * @param handler 认证API处理器函数
 * @returns 标准API处理器
 */
export function withAuth(handler: AuthenticatedApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 验证用户身份 - 获取 Auth0 session
      const session = await auth0.getSession()

      if (!session?.user) {
        return createErrorResponse(
          AUTH_ERROR.UNAUTHORIZED,
          'Authentication required. Please log in to access this resource.',
          null,
          401
        )
      }

      // 从数据库获取完整的用户信息
      const dbUser = await prisma.users.findUnique({
        where: {
          auth0_id: session.user.sub
        },
        include: {
          user_roles: {
            include: {
              role: true
            }
          }
        }
      })

      if (!dbUser || dbUser.is_deleted) {
        return createErrorResponse(
          AUTH_ERROR.UNAUTHORIZED,
          'User not found or has been deactivated.',
          null,
          401
        )
      }

      // 检查用户状态是否为活跃
      if (dbUser.status !== 'active') {
        return createErrorResponse(
          AUTH_ERROR.ACCOUNT_DISABLED,
          'Account has been disabled. Please contact support.',
          null,
          403
        )
      }

      // 构建用户信息对象
      const user = {
        id: dbUser.id,
        auth0_id: dbUser.auth0_id,
        full_name: dbUser.full_name,
        nick_name: dbUser.nick_name,
        user_name: dbUser.user_name,
        email: dbUser.email,
        email_verified: dbUser.email_verified,
        picture: dbUser.picture,
        bio: dbUser.bio,
        gender: dbUser.gender,
        birthday: dbUser.birthday?.toISOString().split('T')[0] || null,
        status: dbUser.status,
        follower_count: dbUser.follower_count,
        following_count: dbUser.following_count,
        is_deleted: dbUser.is_deleted,
        deleted_at: dbUser.deleted_at?.toISOString() || null,
        last_login_at: dbUser.last_login_at?.toISOString() || null,
        created_at: dbUser.created_at.toISOString(),
        updated_at: dbUser.updated_at.toISOString(),
        roles:
          dbUser.user_roles?.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            is_system: ur.role.is_system
          })) || []
      }

      // 调用处理器，传入完整的用户信息
      return handler(req, user)
    } catch (error) {
      console.error('Authentication wrapper error:', error)

      // 处理特定的认证错误
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'ERR_INVALID_TOKEN') {
          return createErrorResponse(
            AUTH_ERROR.INVALID_TOKEN,
            'Invalid authentication token. Please log in again.',
            error,
            401
          )
        }
        if (error.code === 'ERR_TOKEN_EXPIRED') {
          return createErrorResponse(
            AUTH_ERROR.TOKEN_EXPIRED,
            'Authentication token has expired. Please log in again.',
            error,
            401
          )
        }
      }

      return createErrorResponse(
        AUTH_ERROR.UNAUTHORIZED,
        'Authentication failed. Please try logging in again.',
        error,
        401
      )
    }
  }
}
