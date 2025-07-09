import { NextRequest } from 'next/server'
import { buildTree } from '@/lib/tree'
import {
  withApiHandler,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  ApiHandler,
  DATA_ERROR
} from '@/lib/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取角色列表或单个角色详情
 *     description: 获取角色列表或单个角色详情，支持分页、搜索，传入ID参数即获取单个角色详情（包含权限树）
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: false
 *         description: 角色ID，传入此参数时返回单个角色详情
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
 *         description: 搜索关键词，支持按角色名称、描述搜索
 *     responses:
 *       200:
 *         description: 角色列表或单个角色详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: 单个角色详情响应
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
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                         user_count:
 *                           type: integer
 *                           description: 使用此角色的用户数量
 *                         permission_count:
 *                           type: integer
 *                           description: 角色拥有的权限数量
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: 权限ID数组
 *                         permissionsTree:
 *                           type: array
 *                           items:
 *                             type: object
 *                           description: 权限树结构
 *                 - type: object
 *                   description: 角色列表分页响应
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
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                           user_count:
 *                             type: integer
 *                             description: 使用此角色的用户数量
 *                           permission_count:
 *                             type: integer
 *                             description: 角色拥有的权限数量
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
 *         description: 角色不存在（仅在请求单个角色时）
 *       500:
 *         description: 获取角色信息失败
 */

// 缓存类型
type PermissionTreeCache = {
  data: any
  treeData: any
} | null

// 权限树缓存
let permissionTreeCache: PermissionTreeCache = null

/**
 * 获取权限树
 * @param permissionIds 角色关联的权限ID
 * @returns 权限树及权限ID
 */
async function getPermissionTree(permissionIds: number[]) {
  // 获取所有权限
  const data = await prisma.permissions.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      parent_id: true,
      type: true
    },
    orderBy: { id: 'asc' }
  })

  // 添加缓存处理，如果权限数据相同，可以复用之前的树结构
  if (permissionTreeCache && permissionTreeCache.data === data) {
    return {
      treeData: permissionTreeCache.treeData,
      permissionIds: permissionIds.map(id => id.toString())
    }
  }

  // 处理数据中的ID为字符串类型
  const processedData = data.map(item => ({
    ...item,
    id: item.id.toString(),
    parent_id: item.parent_id ? item.parent_id.toString() : null
  }))

  // 将权限列表转换为树状结构
  const treeData = buildTree(processedData)

  // 缓存结果
  permissionTreeCache = {
    data,
    treeData
  }

  return {
    treeData,
    permissionIds: permissionIds.map(id => id.toString())
  }
}

/**
 * 获取角色列表或单个角色
 */
const getRolesHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // 检查是否请求单个角色
  const id = searchParams.get('id')
  if (id) {
    // 为单个角色详情查询单独记录性能
    const detailStartTime = performance.now()

    try {
      // 获取角色基本信息
      const role = await prisma.roles.findUnique({
        where: { id: parseInt(id) },
        include: {
          // 包含关联用户数量
          _count: {
            select: { user_roles: true }
          }
        }
      })

      if (!role) {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Role not found',
          null,
          404
        )
      }

      // 获取角色关联的权限
      const rolePermissions = await prisma.rolePermissions.findMany({
        where: { role_id: parseInt(id) },
        select: { permission_id: true }
      })

      // 获取权限ID数组
      const permissionIds = rolePermissions.map(item =>
        Number(item.permission_id)
      )

      // 获取权限树及关联的权限ID
      const permissionTree = await getPermissionTree(permissionIds)

      // 记录详情查询性能
      const detailDuration = performance.now() - detailStartTime
      console.log(
        `Role detail API performance: ${detailDuration.toFixed(
          2
        )}ms for role ID ${id}`
      )

      // 返回角色详情和关联信息 - 将id转为字符串
      return createSuccessResponse(
        {
          ...role,
          id: role.id.toString(),
          user_count: role._count.user_roles,
          permission_count: permissionIds.length,
          _count: undefined, // 移除原始计数对象
          permissions: permissionTree.permissionIds,
          permissionsTree: permissionTree.treeData
        },
        'Role details retrieved successfully'
      )
    } catch (error) {
      console.error(error)
      return createErrorResponse(
        DATA_ERROR.QUERY_FAILED,
        'Failed to retrieve role details',
        error,
        500
      )
    }
  }

  // 获取角色列表
  const listStartTime = performance.now()

  const page = searchParams.get('page')
    ? parseInt(searchParams.get('page') as string)
    : 1
  const pageSize = searchParams.get('pageSize')
    ? parseInt(searchParams.get('pageSize') as string)
    : 10
  const searchTerm = searchParams.get('searchTerm') || ''

  // 计算分页
  const skip = (page - 1) * pageSize
  const take = pageSize

  // 构建查询条件
  const where: Prisma.RolesWhereInput = {}

  // 应用搜索过滤
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } }
    ]
  }

  try {
    // 获取总记录数
    const count = await prisma.roles.count({ where })

    // 获取角色列表及每个角色关联的用户数量
    const roles = await prisma.roles.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { user_roles: true }
        }
      }
    })

    // 获取每个角色的权限数量
    const roleIds = roles.map(role => role.id)
    const permissionCounts = await prisma.rolePermissions.groupBy({
      by: ['role_id'],
      _count: {
        permission_id: true
      },
      where: {
        role_id: {
          in: roleIds
        }
      }
    })

    // 创建权限数量查找表
    const permissionCountMap = permissionCounts.reduce(
      (acc, item) => {
        acc[Number(item.role_id)] = item._count.permission_id
        return acc
      },
      {} as Record<number, number>
    )

    // 转换响应数据，添加用户数量字段和权限数量字段，并将ID转为字符串
    const rolesWithUserCount = roles.map(role => ({
      ...role,
      id: role.id.toString(),
      user_count: role._count.user_roles,
      permission_count: permissionCountMap[Number(role.id)] || 0,
      _count: undefined // 移除原始计数对象
    }))

    // 记录列表查询性能
    const listDuration = performance.now() - listStartTime
    console.log(
      `Roles list API performance: ${listDuration.toFixed(
        2
      )}ms for page ${page}, pageSize ${pageSize}`
    )

    // 返回分页数据
    return createPaginatedResponse(
      rolesWithUserCount,
      count,
      page,
      pageSize,
      'Roles list retrieved successfully'
    )
  } catch (error) {
    console.error(error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve roles list',
      error,
      500
    )
  }
}

/**
 * @swagger
 * /api/admin/roles:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 创建新角色
 *     description: 创建新角色，支持同时分配权限
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
 *                 description: 角色名称
 *               description:
 *                 type: string
 *                 description: 角色描述
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 权限ID数组
 *     responses:
 *       201:
 *         description: 角色创建成功
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
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求体格式错误
 *       409:
 *         description: 角色名称已存在
 *       500:
 *         description: 创建角色失败
 */

/**
 * 创建新角色
 */
const createRoleHandler: ApiHandler = async (request: NextRequest) => {
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

  const { permissions, ...roleData } = body

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async tx => {
      // 创建角色
      const newRole = await tx.roles.create({
        data: roleData
      })

      // 如果有权限数据，创建角色-权限关联
      if (permissions && permissions.length > 0) {
        await tx.rolePermissions.createMany({
          data: permissions.map((permissionId: number) => ({
            role_id: newRole.id,
            permission_id: permissionId
          }))
        })
      }

      return newRole
    })

    // 将响应中的ID转为字符串
    return createSuccessResponse(
      {
        ...result,
        id: result.id.toString()
      },
      'Role created successfully',
      201
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 唯一性约束错误
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'Role name already exists',
          error,
          409
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create role',
      error,
      500
    )
  }
}

/**
 * @swagger
 * /api/admin/roles:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 更新角色信息
 *     description: 更新角色信息，支持更新角色基本信息和权限关联
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
 *                 description: 角色ID
 *               name:
 *                 type: string
 *                 description: 角色名称
 *               description:
 *                 type: string
 *                 description: 角色描述
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 权限ID数组（字符串格式）
 *     responses:
 *       200:
 *         description: 角色信息更新成功
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
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求体格式错误或缺少必需参数
 *       404:
 *         description: 角色不存在
 *       409:
 *         description: 角色名称已存在
 *       500:
 *         description: 更新角色信息失败
 */

/**
 * 更新角色
 */
const updateRoleHandler: ApiHandler = async (request: NextRequest) => {
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

  console.log(body)

  const { id, permissions, ...roleData } = body

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing role ID',
      null,
      400
    )
  }

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async tx => {
      // 更新角色基本信息
      const updatedRole = await tx.roles.update({
        where: { id: parseInt(id) },
        data: roleData
      })

      console.log('更新角色基本信息')
      // 如果提供了权限数据，更新角色-权限关联
      if (permissions !== undefined) {
        // 先删除现有的权限关联
        await tx.rolePermissions.deleteMany({
          where: { role_id: parseInt(id) }
        })

        console.log('删除现有的权限关联')

        console.log('permissions', permissions)

        // 如果有新的权限数据，创建新的关联
        if (permissions && permissions.length > 0) {
          await tx.rolePermissions.createMany({
            data: permissions.map((permissionId: string) => ({
              role_id: parseInt(id),
              permission_id: parseInt(permissionId)
            }))
          })

          console.log('创建新的权限关联')
        }
      }

      return updatedRole
    })

    // 将响应中的ID转为字符串
    return createSuccessResponse(
      {
        ...result,
        id: result.id.toString()
      },
      'Role updated successfully'
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 唯一性约束错误
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'Role name already exists',
          error,
          409
        )
      }
      // 记录不存在
      if (error.code === 'P2025') {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Role not found',
          error,
          404
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to update role',
      error,
      500
    )
  }
}

/**
 * 删除角色
 */
/**
 * @swagger
 * /api/admin/roles:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: 删除角色
 *     description: 删除角色，会同时删除角色相关的权限关联和用户关联。如果角色被用户使用，将无法删除
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 角色ID
 *     responses:
 *       200:
 *         description: 角色删除成功
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
 *                       description: 已删除的角色ID
 *       400:
 *         description: 角色ID参数未提供
 *       404:
 *         description: 角色不存在
 *       409:
 *         description: 角色正在被用户使用，无法删除
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: object
 *                   properties:
 *                     userCount:
 *                       type: integer
 *                       description: 使用此角色的用户数量
 *       500:
 *         description: 删除角色失败
 */
const deleteRoleHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing role ID',
      null,
      400
    )
  }

  const parsedId = parseInt(id)

  try {
    // 检查角色是否被用户使用
    const userCount = await prisma.userRoles.count({
      where: { role_id: parsedId }
    })

    if (userCount > 0) {
      return createErrorResponse(
        DATA_ERROR.DELETE_FAILED,
        'Cannot delete role: This role is being used by users. Please remove the associations first',
        { userCount },
        409
      )
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async tx => {
      // 删除角色-权限关联
      await tx.rolePermissions.deleteMany({
        where: { role_id: parsedId }
      })

      // 删除用户-角色关联（虽然前面已检查，但为了确保安全，还是执行删除）
      await tx.userRoles.deleteMany({
        where: { role_id: parsedId }
      })

      // 删除角色
      await tx.roles.delete({
        where: { id: parsedId }
      })
    })

    // 将响应中的ID转为字符串
    return createSuccessResponse(
      { id: id.toString() },
      'Role deleted successfully'
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 记录不存在
      if (error.code === 'P2025') {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Role not found',
          error,
          404
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.DELETE_FAILED,
      'Failed to delete role',
      error,
      500
    )
  }
}

// 导出处理函数，使用API中间件包装
export const GET = withApiHandler(getRolesHandler)
export const POST = withApiHandler(createRoleHandler)
export const PUT = withApiHandler(updateRoleHandler)
export const DELETE = withApiHandler(deleteRoleHandler)
