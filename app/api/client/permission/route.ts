import { NextRequest } from 'next/server'
import {
  withApiHandler,
  ApiHandler,
  createSuccessResponse,
  createErrorResponse,
  USER_ERROR
} from '@/lib/server'
import { prisma } from '@/lib/prisma'
import { Permission } from '@/types/permission'

/**
 * @swagger
 * /api/client/permission:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取用户权限列表
 *     description: 根据用户ID获取该用户拥有的所有权限，包括通过角色继承的权限
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 用户ID（UUID格式）
 *         example: "09ad84dc-05d4-4c8b-9877-df7219d7213c"
 *     responses:
 *       200:
 *         description: 用户权限获取成功
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
 *                   example: "User permission retrieval successful"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: 权限ID
 *                         example: 1
 *                       name:
 *                         type: string
 *                         description: 权限名称
 *                         example: "用户管理"
 *                       code:
 *                         type: string
 *                         description: 权限代码
 *                         example: "USER_MANAGE"
 *                       type:
 *                         type: string
 *                         enum: [system, page, module, operation, data]
 *                         description: 权限类型
 *                         example: "page"
 *                       parent_id:
 *                         type: integer
 *                         nullable: true
 *                         description: 父权限ID
 *                         example: null
 *                       description:
 *                         type: string
 *                         description: 权限描述
 *                         example: "管理系统用户"
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
 *                   example: "User ID is not provided"
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
 *                   example: "User permission retrieval failed"
 *                 error:
 *                   type: object
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 */
const getUserPermissionsHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) {
    return createErrorResponse(
      USER_ERROR.NOT_FOUND,
      'User ID is not provided',
      null,
      400
    )
  }

  try {
    // 获取用户角色及关联的权限
    const userRoles = await prisma.userRoles.findMany({
      where: { user_id: userId },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    // 提取所有权限
    const permissions: Permission[] = []
    const permissionMap = new Map()

    userRoles.forEach(userRole => {
      userRole.role.role_permissions.forEach(rolePermission => {
        const permission = rolePermission.permission
        // 避免权限重复
        if (!permissionMap.has(permission.id)) {
          permissionMap.set(permission.id, permission)
          permissions.push({
            id: Number(permission.id),
            name: permission.name ?? '',
            code: permission.code ?? '',
            type: permission.type as
              | 'system'
              | 'page'
              | 'module'
              | 'operation'
              | 'data',
            parent_id: permission.parent_id
              ? Number(permission.parent_id)
              : null,
            description: permission.description ?? undefined
          })
        }
      })
    })

    return createSuccessResponse(
      permissions,
      'User permission retrieval successful'
    )
  } catch (error) {
    console.error('User permission retrieval failed:', error)
    return createErrorResponse(
      USER_ERROR.PERMISSION_RETRIEVAL_FAILED,
      'User permission retrieval failed',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getUserPermissionsHandler)
