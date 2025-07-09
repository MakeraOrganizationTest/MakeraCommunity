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
 * /api/admin/permissions:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取权限列表或单个权限详情
 *     description: 获取权限列表或单个权限详情，支持分页、搜索、类型过滤，可返回树形结构
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: false
 *         description: 权限ID，传入此参数时返回单个权限详情
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
 *         description: 搜索关键词，支持按权限名称、代码、描述搜索
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [menu, page, action, all]
 *         required: false
 *         description: 权限类型过滤
 *       - in: query
 *         name: tree
 *         schema:
 *           type: boolean
 *           default: false
 *         required: false
 *         description: 是否返回树形结构
 *     responses:
 *       200:
 *         description: 权限列表或单个权限详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: 单个权限详情响应
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         code:
 *                           type: string
 *                         description:
 *                           type: string
 *                         type:
 *                           type: string
 *                           enum: [menu, page, action]
 *                         parent_id:
 *                           type: integer
 *                           nullable: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                 - type: object
 *                   description: 权限列表分页响应（平铺或树形）
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
 *                             type: integer
 *                           name:
 *                             type: string
 *                           code:
 *                             type: string
 *                           description:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [menu, page, action]
 *                           parent_id:
 *                             type: integer
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                           children:
 *                             type: array
 *                             description: 子权限（仅在tree=true时存在）
 *                             items:
 *                               $ref: '#/components/schemas/Permission'
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
 *         description: 权限不存在（仅在请求单个权限时）
 *       500:
 *         description: 获取权限信息失败
 */

/**
 * 获取权限列表或单个权限
 */
const getPermissionsHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // 检查是否请求单个权限
  const id = searchParams.get('id')
  if (id) {
    const permission = await prisma.permissions.findUnique({
      where: { id: parseInt(id) }
    })

    if (!permission) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Permission not found',
        null,
        404
      )
    }

    return createSuccessResponse(permission)
  }

  // 获取权限列表
  const page = searchParams.get('page')
    ? parseInt(searchParams.get('page') as string)
    : 1
  const pageSize = searchParams.get('pageSize')
    ? parseInt(searchParams.get('pageSize') as string)
    : 10
  const searchTerm = searchParams.get('searchTerm') || ''
  const type = searchParams.get('type') || ''
  const tree = searchParams.get('tree') === 'true' // 判断是否请求树形结构

  // 计算分页
  const skip = (page - 1) * pageSize
  const take = pageSize

  // 构建查询条件
  const where: Prisma.PermissionsWhereInput = {}

  // 应用搜索过滤
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { code: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } }
    ]
  }

  // 应用类型过滤
  if (type && type !== 'all') {
    where.type = type as any // 使用类型断言解决类型问题
  }

  try {
    // 获取总记录数
    const count = await prisma.permissions.count({ where })

    // 获取数据
    const data = await prisma.permissions.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'asc' }
    })

    // 如果请求树形结构，将扁平数组转换为树状结构
    if (tree && data) {
      const treeData = buildTree(data)
      return createPaginatedResponse(
        treeData,
        count,
        page,
        pageSize,
        'Permission tree retrieved successfully'
      )
    }

    return createPaginatedResponse(
      data,
      count,
      page,
      pageSize,
      'Permissions list retrieved successfully'
    )
  } catch (error) {
    console.log(error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to query permissions',
      error,
      500
    )
  }
}

/**
 * @swagger
 * /api/admin/permissions:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 创建新权限
 *     description: 创建新权限，支持创建菜单、页面、操作类型的权限
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: 权限名称
 *               code:
 *                 type: string
 *                 description: 权限代码（唯一标识）
 *               description:
 *                 type: string
 *                 description: 权限描述
 *               type:
 *                 type: string
 *                 enum: [menu, page, action]
 *                 description: 权限类型
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: 父权限ID
 *     responses:
 *       201:
 *         description: 权限创建成功
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
 *                       type: integer
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [menu, page, action]
 *                     parent_id:
 *                       type: integer
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求体格式错误
 *       409:
 *         description: 权限代码已存在
 *       500:
 *         description: 创建权限失败
 */

/**
 * 创建新权限
 */
const createPermissionHandler: ApiHandler = async (request: NextRequest) => {
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

  try {
    console.log('body', body)
    // 创建权限
    const data = await prisma.permissions.create({
      data: body
    })

    return createSuccessResponse(data, 'Permission created successfully', 201)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 唯一性约束错误
      if (error.code === 'P2002') {
        console.log(error)
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'Permission code already exists',
          error,
          409
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create permission',
      error,
      500
    )
  }
}

/**
 * @swagger
 * /api/admin/permissions:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 更新权限信息
 *     description: 更新权限信息，支持更新权限的所有字段
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
 *                 type: integer
 *                 description: 权限ID
 *               name:
 *                 type: string
 *                 description: 权限名称
 *               code:
 *                 type: string
 *                 description: 权限代码（唯一标识）
 *               description:
 *                 type: string
 *                 description: 权限描述
 *               type:
 *                 type: string
 *                 enum: [menu, page, action]
 *                 description: 权限类型
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: 父权限ID
 *     responses:
 *       200:
 *         description: 权限信息更新成功
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
 *                       type: integer
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [menu, page, action]
 *                     parent_id:
 *                       type: integer
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求体格式错误或缺少必需参数
 *       404:
 *         description: 权限不存在
 *       409:
 *         description: 权限代码已存在
 *       500:
 *         description: 更新权限信息失败
 */

/**
 * 更新权限
 */
const updatePermissionHandler: ApiHandler = async (request: NextRequest) => {
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

  const { id, ...permissionData } = body

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing permission ID',
      null,
      400
    )
  }

  try {
    // 更新权限
    const data = await prisma.permissions.update({
      where: { id: parseInt(id) },
      data: permissionData
    })

    return createSuccessResponse(data, 'Permission updated successfully')
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 唯一性约束错误
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'Permission code already exists',
          error,
          409
        )
      }
      // 记录不存在
      if (error.code === 'P2025') {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Permission not found',
          error,
          404
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to update permission',
      error,
      500
    )
  }
}

/**
 * 删除权限
 */
/**
 * @swagger
 * /api/admin/permissions:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: 删除权限
 *     description: 删除权限，会检查是否有子权限和角色关联。如果存在子权限或被角色使用，将无法删除
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 权限ID
 *     responses:
 *       200:
 *         description: 权限删除成功
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
 *                       type: integer
 *                       description: 已删除的权限ID
 *       400:
 *         description: 权限ID参数未提供
 *       404:
 *         description: 权限不存在
 *       409:
 *         description: 权限无法删除（存在子权限或被角色使用）
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
 *                   oneOf:
 *                     - properties:
 *                         childrenCount:
 *                           type: integer
 *                           description: 子权限数量
 *                     - properties:
 *                         rolesCount:
 *                           type: integer
 *                           description: 使用此权限的角色数量
 *       500:
 *         description: 删除权限失败
 */
const deletePermissionHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing permission ID',
      null,
      400
    )
  }

  const parsedId = parseInt(id)

  try {
    // 先检查是否有子权限
    const childrenCount = await prisma.permissions.count({
      where: { parent_id: parsedId }
    })

    if (childrenCount > 0) {
      return createErrorResponse(
        DATA_ERROR.DELETE_FAILED,
        'Cannot delete permission: Child permissions exist. Please delete all child permissions first',
        { childrenCount },
        409
      )
    }

    // 检查是否与角色关联
    const rolePermissionsCount = await prisma.rolePermissions.count({
      where: { permission_id: parsedId }
    })

    if (rolePermissionsCount > 0) {
      return createErrorResponse(
        DATA_ERROR.DELETE_FAILED,
        'Cannot delete permission: This permission is being used by roles. Please remove the associations first',
        { rolesCount: rolePermissionsCount },
        409
      )
    }

    // 删除权限
    await prisma.permissions.delete({
      where: { id: parsedId }
    })

    return createSuccessResponse(
      { id: parsedId },
      'Permission deleted successfully'
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 记录不存在
      if (error.code === 'P2025') {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Permission not found',
          error,
          404
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.DELETE_FAILED,
      'Failed to delete permission',
      error,
      500
    )
  }
}

// 导出处理函数，使用API中间件包装
export const GET = withApiHandler(getPermissionsHandler)
export const POST = withApiHandler(createPermissionHandler)
export const PUT = withApiHandler(updatePermissionHandler)
export const DELETE = withApiHandler(deletePermissionHandler)
