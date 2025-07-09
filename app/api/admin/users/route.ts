import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withApiHandler,
  ApiHandler,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  DATA_ERROR,
  USER_ERROR
} from '@/lib/server'
import { Prisma } from '@/generated/prisma'

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取用户列表或单个用户详情
 *     description: 获取用户列表或单个用户详情，支持分页、搜索、状态过滤，传入ID参数即获取单个用户详情
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: false
 *         description: 用户ID，传入此参数时返回单个用户详情
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         required: false
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         required: false
 *         description: 每页条数
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         required: false
 *         description: 搜索关键词，支持按用户名、全名、邮箱搜索
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned, all]
 *         required: false
 *         description: 用户状态过滤
 *     responses:
 *       200:
 *         description: 用户列表或单个用户详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: 单个用户详情响应
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         auth0_id:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         nick_name:
 *                           type: string
 *                         user_name:
 *                           type: string
 *                         picture:
 *                           type: string
 *                         email:
 *                           type: string
 *                         email_verified:
 *                           type: boolean
 *                         bio:
 *                           type: string
 *                         gender:
 *                           type: string
 *                         birthday:
 *                           type: string
 *                         status:
 *                           type: string
 *                         follower_count:
 *                           type: number
 *                         following_count:
 *                           type: number
 *                         is_deleted:
 *                           type: boolean
 *                         deleted_at:
 *                           type: string
 *                           format: date-time
 *                         last_login_at:
 *                           type: string
 *                           format: date-time
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: number
 *                               name:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                 - type: object
 *                   description: 用户列表分页响应
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           auth0_id:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           nick_name:
 *                             type: string
 *                           user_name:
 *                             type: string
 *                           picture:
 *                             type: string
 *                           email:
 *                             type: string
 *                           email_verified:
 *                             type: boolean
 *                           status:
 *                             type: string
 *                           follower_count:
 *                             type: number
 *                           following_count:
 *                             type: number
 *                           last_login_at:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           roles:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: number
 *                                 name:
 *                                   type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       404:
 *         description: 用户不存在（仅在请求单个用户时）
 *       500:
 *         description: 获取用户信息失败
 */
const getUsersHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // 检查是否请求单个用户
  const id = searchParams.get('id')
  if (id) {
    try {
      // 获取用户基本信息
      const user = await prisma.users.findUnique({
        where: { id },
        include: {
          user_roles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      })

      if (!user) {
        return createErrorResponse(
          USER_ERROR.NOT_FOUND,
          'User not found',
          null,
          404
        )
      }

      // 转换用户数据为期望的格式
      const userData = {
        ...user,
        roles: user.user_roles.map(ur => ur.role),
        user_roles: undefined // 移除原始关联数据
      }

      // 返回用户详情及角色
      return createSuccessResponse(
        userData,
        'User details retrieved successfully'
      )
    } catch (error) {
      return createErrorResponse(
        DATA_ERROR.QUERY_FAILED,
        'Failed to retrieve user details',
        error,
        500
      )
    }
  }

  // 获取用户列表
  const page = searchParams.get('page')
    ? parseInt(searchParams.get('page') as string)
    : 1
  const pageSize = searchParams.get('pageSize')
    ? parseInt(searchParams.get('pageSize') as string)
    : 10
  const searchTerm = searchParams.get('searchTerm') || ''
  const status = searchParams.get('status') || ''

  // 计算分页
  const skip = (page - 1) * pageSize
  const take = pageSize

  // 构建查询条件
  const where: Prisma.UsersWhereInput = {
    is_deleted: false // 排除逻辑删除的用户
  }

  // 应用搜索过滤 - 更新搜索字段以包含 nick_name
  if (searchTerm) {
    where.OR = [
      { full_name: { contains: searchTerm, mode: 'insensitive' } },
      { nick_name: { contains: searchTerm, mode: 'insensitive' } },
      { user_name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } }
    ]
  }

  // 应用状态过滤
  if (status && status !== 'all') {
    where.status = status as any
  }

  try {
    // 获取总记录数
    const count = await prisma.users.count({ where })

    // 获取用户列表
    const users = await prisma.users.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        user_roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // 转换响应数据，添加角色信息
    const usersWithRoles = users.map(user => ({
      ...user,
      roles: user.user_roles.map(ur => ur.role),
      user_roles: undefined // 移除原始关联数据
    }))

    // 返回分页数据
    return createPaginatedResponse(
      usersWithRoles,
      count,
      page,
      pageSize,
      'Users list retrieved successfully'
    )
  } catch (error) {
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve users list',
      error,
      500
    )
  }
}

/**
 * @swagger
 * /api/admin/users:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 更新用户信息
 *     description: 更新用户信息，支持更新用户基本信息、角色关联
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: 用户ID
 *               full_name:
 *                 type: string
 *                 description: 用户全名
 *                 nullable: true
 *               nick_name:
 *                 type: string
 *                 description: 用户昵称
 *                 nullable: true
 *               user_name:
 *                 type: string
 *                 description: 用户名
 *                 nullable: true
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱地址
 *               bio:
 *                 type: string
 *                 description: 个人简介
 *                 nullable: true
 *               gender:
 *                 type: string
 *                 description: 性别
 *                 nullable: true
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: 生日
 *                 nullable: true
 *               status:
 *                 type: string
 *                 description: 用户状态
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: 角色ID数组
 *     responses:
 *       200:
 *         description: 用户信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     auth0_id:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     nick_name:
 *                       type: string
 *                     user_name:
 *                       type: string
 *                     picture:
 *                       type: string
 *                     email:
 *                       type: string
 *                     email_verified:
 *                       type: boolean
 *                     bio:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     birthday:
 *                       type: string
 *                     status:
 *                       type: string
 *                     follower_count:
 *                       type: number
 *                     following_count:
 *                       type: number
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *       400:
 *         description: 请求体格式错误或缺少必需参数
 *       409:
 *         description: 用户名或邮箱已存在
 *       500:
 *         description: 更新用户信息失败
 */
const updateUserHandler: ApiHandler = async (request: NextRequest) => {
  // 获取请求体
  let body
  try {
    body = await request.json()
  } catch (error) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Invalid request body',
      error,
      400
    )
  }

  const { id, roleIds, ...userData } = body

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing user ID',
      null,
      400
    )
  }

  // 清理数据：处理空字符串的日期字段
  const cleanedUserData = { ...userData }

  // 处理日期字段
  if (cleanedUserData.birthday === '') {
    cleanedUserData.birthday = null
  }

  // 处理其他可能为空的字符串字段
  const stringFields = ['full_name', 'nick_name', 'user_name', 'bio', 'gender']
  stringFields.forEach(field => {
    if (cleanedUserData[field] === '') {
      cleanedUserData[field] = null
    }
  })

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async tx => {
      // 更新用户基本信息
      const updatedUser = await tx.users.update({
        where: { id },
        data: cleanedUserData
      })

      // 如果提供了角色数据，更新用户-角色关联
      if (roleIds !== undefined) {
        // 删除现有角色关联
        await tx.userRoles.deleteMany({
          where: { user_id: id }
        })

        // 如果有新的角色数据，创建新的关联
        if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
          // 验证所有角色ID是否有效
          const sanitizedRoleIds = roleIds.filter(
            roleId => typeof roleId === 'number' && !isNaN(roleId) && roleId > 0
          )

          if (sanitizedRoleIds.length > 0) {
            // 创建用户角色关联记录
            await tx.userRoles.createMany({
              data: sanitizedRoleIds.map((roleId: number) => ({
                user_id: id,
                role_id: roleId
              }))
            })
          }
        }
      }

      return updatedUser
    })

    // 获取更新后的用户信息（包括角色）
    const updatedUserWithRoles = await prisma.users.findUnique({
      where: { id },
      include: {
        user_roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    })

    // 转换用户数据为期望的格式
    const userData = {
      ...updatedUserWithRoles,
      roles: updatedUserWithRoles?.user_roles.map(ur => ur.role) || [],
      user_roles: undefined // 移除原始关联数据
    }

    return createSuccessResponse(
      userData,
      'User information updated successfully'
    )
  } catch (error) {
    // 检查是否为唯一性约束错误
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'Username or email already exists',
          error,
          409
        )
      }
    }
    return createErrorResponse(
      USER_ERROR.UPDATE_FAILED,
      'Failed to update user information',
      error,
      500
    )
  }
}

/**
 * @swagger
 * /api/admin/users:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: 删除用户（逻辑删除或硬删除）
 *     description: 删除用户，支持逻辑删除和硬删除，传入ID参数即删除单个用户
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 用户ID
 *       - in: query
 *         name: hardDelete
 *         schema:
 *           type: boolean
 *         required: false
 *         description: 是否硬删除，默认为false（逻辑删除）
 *     responses:
 *       200:
 *         description: 用户删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 用户ID
 *                     deletionType:
 *                       type: string
 *                       enum: [soft, hard]
 *                       description: 删除类型，soft为逻辑删除，hard为硬删除
 *       400:
 *         description: 用户ID参数未提供
 *       404:
 *         description: 用户不存在或已删除
 *       500:
 *         description: 删除用户失败
 */
const deleteUserHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const hardDelete = searchParams.get('hardDelete') === 'true'

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing user ID',
      null,
      400
    )
  }

  try {
    // 检查用户是否存在
    const user = await prisma.users.findUnique({
      where: { id }
    })

    if (!user) {
      return createErrorResponse(
        USER_ERROR.NOT_FOUND,
        'User not found',
        null,
        404
      )
    }

    if (hardDelete) {
      // 使用事务进行硬删除
      await prisma.$transaction(async tx => {
        // 先删除用户-角色关联
        await tx.userRoles.deleteMany({
          where: { user_id: id }
        })

        // 然后删除用户记录
        await tx.users.delete({
          where: { id }
        })
      })

      return createSuccessResponse(
        { id, deletionType: 'hard' },
        'User permanently deleted'
      )
    } else {
      // 逻辑删除 - 仅标记用户为已删除
      await prisma.users.update({
        where: { id },
        data: {
          is_deleted: true,
          deleted_at: new Date(),
          status: 'inactive'
        }
      })

      return createSuccessResponse(
        { id, deletionType: 'soft' },
        'User deactivated'
      )
    }
  } catch (error) {
    return createErrorResponse(
      USER_ERROR.DELETE_FAILED,
      'Failed to delete user',
      error,
      500
    )
  }
}

// 导出处理函数，使用API中间件包装
export const GET = withApiHandler(getUsersHandler)
export const PUT = withApiHandler(updateUserHandler)
export const DELETE = withApiHandler(deleteUserHandler)
