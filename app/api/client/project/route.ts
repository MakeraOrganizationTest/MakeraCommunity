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
import { auth0 } from '@/lib/auth0'
import type { ApiHandler, AuthenticatedApiHandler } from '@/lib/server/types'
import type { User } from '@/types/user'

// 使用 CTE 递归查询获取完整的分类父级链 - 返回数组，父级在前
async function getCategoryWithParents(
  prisma: any,
  categoryId: number
): Promise<any[]> {
  const result = await prisma.$queryRaw`
    WITH RECURSIVE category_hierarchy AS (
      -- 基础查询：查询目标分类
      SELECT id, name, slug, description, parent_id, 0 as level
      FROM project_categories
      WHERE id = ${categoryId}
      
      UNION ALL
      
      -- 递归查询：查询所有父级分类
      SELECT pc.id, pc.name, pc.slug, pc.description, pc.parent_id, ch.level + 1 as level
      FROM project_categories pc
      INNER JOIN category_hierarchy ch ON pc.id = ch.parent_id
    )
    SELECT * FROM category_hierarchy
    ORDER BY level DESC
  `

  if (!result || (result as any[]).length === 0) {
    return []
  }

  const categories = result as any[]

  // 直接返回数组，移除level字段
  return categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    parent_id: category.parent_id
  }))
}

// 获取用户对项目的点赞状态
const getUserProjectLikeStatus = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  if (!userId || !projectId) {
    return false
  }

  const like = await prisma.likes.findFirst({
    where: {
      user_id: userId,
      content_type: 'model',
      content_id: projectId
    }
  })

  return !!like
}

/**
 * @swagger
 * /api/client/project:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取项目详细信息
 *     description: 根据项目ID获取项目的完整信息，包括创建者、分类、许可证、标签等关联数据
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 项目ID（UUID格式）
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: 项目信息获取成功
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
 *                   example: "Project details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 项目ID
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     name:
 *                       type: string
 *                       description: 项目名称
 *                       example: "智能桌面CNC项目"
 *                       nullable: true
 *                     slug:
 *                       type: string
 *                       description: URL友好的项目别名
 *                       example: "smart-desktop-cnc"
 *                       nullable: true
 *                     description:
 *                       type: string
 *                       description: 项目描述（富文本）
 *                       example: "这是一个创新的桌面CNC项目..."
 *                       nullable: true
 *                     creation_type:
 *                       type: string
 *                       enum: [original, derivative]
 *                       description: 原创属性
 *                       example: "original"
 *                     derivative_sources:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 二创源地址（当creation_type为derivative时）
 *                       example: ["https://example.com/source1"]
 *                     cover_web:
 *                       type: string
 *                       description: 网页端封面图(4:3)
 *                       example: "https://example.com/cover.jpg"
 *                       nullable: true
 *                     cover_mobile:
 *                       type: string
 *                       description: 移动端封面图(3:4)
 *                       example: "https://example.com/cover_mobile.jpg"
 *                       nullable: true
 *                     gallery:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 展示图片
 *                       example: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
 *                     machines_used:
 *                       type: object
 *                       description: 使用的机器信息，包含id和name字段
 *                       example: {"id": "machine-uuid", "name": "桌面CNC", "description": "小型桌面级数控机床", "thumbnail": "https://example.com/machine.jpg"}
 *                       nullable: true
 *                     other_parts:
 *                       type: array
 *                       description: 其他配件信息
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: 配件名称
 *                             example: "螺丝刀套装"
 *                           remark:
 *                             type: string
 *                             description: 配件备注
 *                             example: "用于组装时使用"
 *                             nullable: true
 *                       example: [{"name": "螺丝刀套装", "remark": "用于组装时使用"}, {"name": "胶水", "remark": ""}]
 *                     status:
 *                       type: string
 *                       enum: [draft, submitted, approved, rejected, published, archived]
 *                       description: 项目状态
 *                       example: "published"
 *                     visibility:
 *                       type: string
 *                       enum: [public, private]
 *                       description: 可见性
 *                       example: "public"
 *                     likes_count:
 *                       type: integer
 *                       description: 点赞数量
 *                       example: 125
 *                     favorites_count:
 *                       type: integer
 *                       description: 收藏数量
 *                       example: 89
 *                     comments_count:
 *                       type: integer
 *                       description: 评论数量
 *                       example: 23
 *                     downloads_count:
 *                       type: integer
 *                       description: 下载数量
 *                       example: 456
 *                     views_count:
 *                       type: integer
 *                       description: 浏览数量
 *                       example: 1234
 *                     shares_count:
 *                       type: integer
 *                       description: 分享数量
 *                       example: 67
 *                     is_featured:
 *                       type: boolean
 *                       description: 是否是精选作品
 *                       example: true
 *                     is_liked:
 *                       type: boolean
 *                       description: 当前用户是否点赞了该项目（仅登录用户返回）
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: 创建时间
 *                       example: "2025-01-15T10:30:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: 更新时间
 *                       example: "2025-01-15T10:30:00.000Z"
 *                     creator:
 *                       type: object
 *                       description: 创建者信息
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "creator-uuid"
 *                         full_name:
 *                           type: string
 *                           example: "张三"
 *                         user_name:
 *                           type: string
 *                           example: "zhangsan"
 *                         avatar_url:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                     categories:
 *                       type: array
 *                       description: 项目分类层级链（父级在前）
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "机械零件"
 *                           slug:
 *                             type: string
 *                             example: "mechanical"
 *                           description:
 *                             type: string
 *                             example: "各种机械相关零件"
 *                             nullable: true
 *                           parent_id:
 *                             type: integer
 *                             example: null
 *                             nullable: true
 *                       example: [
 *                         {
 *                           "id": 1,
 *                           "name": "机械零件",
 *                           "slug": "mechanical",
 *                           "description": "各种机械相关零件",
 *                           "parent_id": null
 *                         },
 *                         {
 *                           "id": 2,
 *                           "name": "齿轮",
 *                           "slug": "gear",
 *                           "description": "各种齿轮模型",
 *                           "parent_id": 1
 *                         },
 *                         {
 *                           "id": 3,
 *                           "name": "直齿齿轮",
 *                           "slug": "spur-gear",
 *                           "description": "直齿齿轮相关模型",
 *                           "parent_id": 2
 *                         }
 *                       ]
 *                     license:
 *                       type: object
 *                       description: 许可证信息
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "license-uuid"
 *                         name:
 *                           type: string
 *                           example: "Creative Commons BY"
 *                         slug:
 *                           type: string
 *                           example: "cc_by"
 *                         description:
 *                           type: string
 *                           example: "署名许可协议"
 *                         icon:
 *                           type: string
 *                           example: "https://example.com/cc_by.png"
 *                     tags:
 *                       type: array
 *                       description: 项目标签
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: "CNC"
 *                     files:
 *                       type: array
 *                       description: 项目文件列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "file-uuid"
 *                           name:
 *                             type: string
 *                             example: "桌面CNC配置文件"
 *                           description:
 *                             type: string
 *                             example: "适用于桌面级CNC的配置文件"
 *                             nullable: true
 *                           file_path:
 *                             type: string
 *                             example: "/files/project/config.mkc"
 *                           file_size:
 *                             type: integer
 *                             example: 2048576
 *                           file_type:
 *                             type: string
 *                             example: "mkc"
 *                           thumbnail:
 *                             type: string
 *                             example: "https://example.com/thumbnail.jpg"
 *                             nullable: true
 *                           preview_model_path:
 *                             type: string
 *                             example: "/files/preview/model.stl"
 *                             nullable: true
 *                           order:
 *                             type: integer
 *                             example: 1
 *                             nullable: true
 *                           cutters:
 *                             type: array
 *                             example: [[{"name": "6mm平底刀", "id": "cutter-uuid"}, {"name": "3mm雕刻刀", "id": "cutter-uuid-2"}], [{"name": "钻头", "id": "cutter-uuid-3"}]]
 *                             nullable: true
 *                           blank:
 *                             type: array
 *                             example: [{"name": "实木板材", "id": "material-uuid"}, {"name": "MDF板", "id": "material-uuid-2"}]
 *                             nullable: true
 *                           parameters:
 *                             type: object
 *                             example: {"speed": 12000, "feed": 1000}
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00.000Z"
 *                     original_files:
 *                       type: array
 *                       description: 项目原始文件列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "original-file-uuid"
 *                           name:
 *                             type: string
 *                             example: "原始设计文件"
 *                           description:
 *                             type: string
 *                             example: "项目的原始设计文件"
 *                             nullable: true
 *                           file_path:
 *                             type: string
 *                             example: "/files/original/design.f3d"
 *                           file_size:
 *                             type: integer
 *                             example: 5242880
 *                           file_type:
 *                             type: string
 *                             example: "f3d"
 *                           thumbnail:
 *                             type: string
 *                             example: "https://example.com/original_thumbnail.jpg"
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00.000Z"
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
 *                   example: "Invalid request parameters"
 *                 error:
 *                   type: object
 *                   nullable: true
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 *       401:
 *         description: 未认证
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
 *                   example: "Authentication required"
 *                 error:
 *                   type: object
 *                   nullable: true
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 *       403:
 *         description: 无权限操作
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
 *                   example: "You do not have permission to modify this project"
 *                 error:
 *                   type: object
 *                   nullable: true
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 *       404:
 *         description: 项目不存在
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
 *                   example: "Project not found or has been deleted"
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
 *                   example: "Failed to retrieve project details"
 *                 error:
 *                   type: object
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 *   post:
 *     tags:
 *       - Client
 *     summary: 新增或修改项目基本信息
 *     description: |
 *       创建新项目或修改现有项目的基本信息。传入ID时为修改模式，不传ID时为新增模式。
 *
 *       **注意：此接口只处理项目基本信息，项目文件和原始文件需要通过独立的API进行管理。**
 *
 *       - 项目文件管理：`/api/client/project/files`
 *       - 原始文件管理：`/api/client/project/original-files`
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: 项目ID（修改时必传，新增时不传）
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               name:
 *                 type: string
 *                 description: 项目名称（系统将自动根据名称生成URL友好的别名）
 *                 example: "智能桌面CNC项目"
 *               description:
 *                 type: string
 *                 description: 项目描述（富文本）
 *                 example: "这是一个创新的桌面CNC项目..."
 *               creation_type:
 *                 type: string
 *                 enum: [original, derivative]
 *                 description: 原创属性
 *                 example: "original"
 *               derivative_sources:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 二创源地址（当creation_type为derivative时）
 *                 example: ["https://example.com/source1"]
 *               category_id:
 *                 type: integer
 *                 description: 项目分类ID
 *                 example: 1
 *               license_id:
 *                 type: string
 *                 description: 许可证ID
 *                 example: "license-uuid"
 *               cover_web:
 *                 type: string
 *                 description: 网页端封面图(4:3)
 *                 example: "https://example.com/cover.jpg"
 *               cover_mobile:
 *                 type: string
 *                 description: 移动端封面图(3:4)
 *                 example: "https://example.com/cover_mobile.jpg"
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 展示图片
 *                 example: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
 *               machines_used:
 *                 type: object
 *                 description: 使用的机器信息（id和name至少有一个必填）
 *                 example: {"id": "machine-uuid", "name": "桌面CNC"}
 *               other_parts:
 *                 type: array
 *                 description: 其他配件信息
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: 配件名称（必填）
 *                       example: "螺丝刀套装"
 *                     remark:
 *                       type: string
 *                       description: 配件备注（选填）
 *                       example: "用于组装时使用"
 *                 example: [{"name": "螺丝刀套装", "remark": "用于组装时使用"}, {"name": "胶水"}]
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 description: 可见性
 *                 example: "public"
 *               tag_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 标签ID列表
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 项目创建/修改成功
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
 *                   example: "Project created/updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 项目ID
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
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
 *                   example: "Invalid request parameters"
 *                 error:
 *                   type: object
 *                   nullable: true
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 *       404:
 *         description: 项目不存在（修改模式）
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
 *                   example: "Project not found"
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
 *                   example: "Failed to create/update project"
 *                 error:
 *                   type: object
 *                 timestamp:
 *                   type: integer
 *                   example: 1748933761442
 */

const getProjectHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('id')

  // 验证必需参数
  if (!projectId) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Project ID is required',
      null,
      400
    )
  }

  try {
    // 尝试获取用户身份信息（可选）
    let currentUser: User | null = null

    try {
      const session = await auth0.getSession()
      if (session?.user) {
        // 从数据库获取完整的用户信息
        currentUser = await prisma.users.findUnique({
          where: {
            auth0_id: session.user.sub
          }
        })
      }
    } catch (error) {
      // 忽略认证错误，继续执行（支持未登录用户访问）
      console.warn(
        'Failed to get user session (this is normal for SSR):',
        error
      )
    }

    // 查询项目详细信息
    const project = await prisma.projects.findUnique({
      where: {
        id: projectId,
        is_deleted: false // 只查询未删除的项目
      },
      include: {
        // 创建者信息
        creator: {
          select: {
            id: true,
            nick_name: true,
            user_name: true,
            picture: true
          }
        },
        // 项目分类信息
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parent_id: true
          }
        },
        // 许可证信息
        license: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            thumbnail: true
          }
        },
        // 项目标签
        project_tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        // 项目文件信息
        project_files: {
          select: {
            id: true,
            name: true,
            description: true,
            file_path: true,
            file_size: true,
            file_type: true,
            thumbnail: true,
            preview_model_path: true,
            order: true,
            cutters: true,
            blank: true,
            parameters: true,
            created_at: true,
            updated_at: true
          },
          orderBy: [{ order: 'asc' }, { created_at: 'asc' }]
        },
        // 项目原始文件信息
        project_original_files: {
          select: {
            id: true,
            name: true,
            description: true,
            file_path: true,
            file_size: true,
            file_type: true,
            thumbnail: true,
            created_at: true,
            updated_at: true
          },
          orderBy: {
            created_at: 'asc'
          }
        }
      }
    })

    // 检查项目是否存在
    if (!project) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Project not found or has been deleted',
        null,
        404
      )
    }

    // 检查项目可见性权限
    if (project.visibility === 'private') {
      // 这里可以添加权限检查逻辑
      // 例如：检查当前用户是否为项目创建者或有权限访问
      // 暂时简化处理，私有项目也返回（实际应用中需要根据业务需求调整）
    }

    // 处理机器信息 - 如果有id则查询详细信息
    let machinesUsedData = null
    if (project.machines_used) {
      const machinesUsed = project.machines_used as any
      if (machinesUsed.id) {
        // 查询机器详细信息
        const machineDetail = await prisma.machines.findUnique({
          where: { id: machinesUsed.id },
          select: {
            id: true,
            name: true,
            description: true,
            thumbnail: true
          }
        })

        if (machineDetail) {
          machinesUsedData = {
            id: machineDetail.id,
            name: machineDetail.name,
            description: machineDetail.description,
            thumbnail: machineDetail.thumbnail
          }
        } else {
          // 如果ID对应的机器不存在，则只返回name
          machinesUsedData = { name: machinesUsed.name }
        }
      } else if (machinesUsed.name) {
        // 只有name的情况
        machinesUsedData = { name: machinesUsed.name }
      }
    }

    // 查询项目附件列表
    const attachments = await prisma.projectAttachments.findMany({
      where: { project_id: projectId },
      orderBy: [{ created_at: 'asc' }]
    })
    // 递归查询完整的分类父级链
    let categoryWithParents = project.category ? [project.category] : []
    if (project.category) {
      categoryWithParents = await getCategoryWithParents(
        prisma,
        project.category.id
      )
    }

    // 获取用户对项目的点赞状态
    const isLiked = currentUser
      ? await getUserProjectLikeStatus(currentUser.id, projectId)
      : undefined

    // 构建响应数据
    const projectData = {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      creation_type: project.creation_type,
      derivative_sources: project.derivative_sources,
      cover_web: project.cover_web,
      cover_mobile: project.cover_mobile,
      gallery: project.gallery,
      machines_used: machinesUsedData,
      other_parts: project.other_parts,
      status: project.status,
      visibility: project.visibility,
      likes_count: project.likes_count,
      favorites_count: project.favorites_count,
      comments_count: project.comments_count,
      downloads_count: project.downloads_count,
      views_count: project.views_count,
      shares_count: project.shares_count,
      is_featured: project.is_featured,
      created_at: project.created_at,
      updated_at: project.updated_at,
      creator: project.creator,
      categories: categoryWithParents,
      license: project.license,
      tags: project.project_tags.map(pt => pt.tag),
      files: project.project_files,
      original_files: project.project_original_files,
      attachments,
      is_liked: isLiked
    }

    return createSuccessResponse(
      projectData,
      'Project details retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve project details:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve project details',
      error,
      500
    )
  }
}

const projectHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      creation_type,
      derivative_sources,
      category_id,
      license_id,
      cover_web,
      cover_mobile,
      gallery,
      machines_used,
      other_parts,
      visibility,
      tag_ids
    } = body

    console.log('===== body ===== \n: ', body)

    // 验证 machines_used 字段
    if (machines_used) {
      if (typeof machines_used !== 'object' || Array.isArray(machines_used)) {
        return createErrorResponse(
          DATA_ERROR.VALIDATION_FAILED,
          'machines_used must be an object',
          null,
          400
        )
      }

      if (!machines_used.id && !machines_used.name) {
        return createErrorResponse(
          DATA_ERROR.VALIDATION_FAILED,
          'machines_used must contain either id or name field',
          null,
          400
        )
      }
    }

    // 验证 other_parts 字段
    if (other_parts) {
      if (!Array.isArray(other_parts)) {
        return createErrorResponse(
          DATA_ERROR.VALIDATION_FAILED,
          'other_parts must be an array',
          null,
          400
        )
      }

      for (let i = 0; i < other_parts.length; i++) {
        const part = other_parts[i]
        if (typeof part !== 'object' || !part.name) {
          return createErrorResponse(
            DATA_ERROR.VALIDATION_FAILED,
            `other_parts[${i}] must be an object with required name field`,
            null,
            400
          )
        }
      }

      // 过滤只保留name和remark字段
      const filteredOtherParts = other_parts.map((part: any) => ({
        name: part.name,
        ...(part.remark !== undefined && { remark: part.remark })
      }))
      body.other_parts = filteredOtherParts
    }

    // 判断是新增还是修改
    const isUpdate = !!id

    if (isUpdate) {
      // 修改模式：验证项目是否存在，并检查用户权限
      const existingProject = await prisma.projects.findUnique({
        where: { id, is_deleted: false }
      })

      if (!existingProject) {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Project not found',
          null,
          404
        )
      }

      // 检查用户是否有权限修改此项目（只有创建者可以修改）
      if (existingProject.creator_id !== user.id) {
        return createErrorResponse(
          AUTH_ERROR.FORBIDDEN,
          'You do not have permission to modify this project',
          null,
          403
        )
      }
    }

    // slug 将使用项目ID，在项目创建/更新后设置

    // 使用事务处理项目和标签数据
    const result = await prisma.$transaction(async tx => {
      // 准备项目数据，只更新传递了的字段
      const baseProjectData: any = {
        updated_at: new Date()
      }

      // 只有在字段存在于请求体中时才添加到更新数据中
      if ('name' in body) baseProjectData.name = name
      if ('description' in body) baseProjectData.description = description
      if ('creation_type' in body) baseProjectData.creation_type = creation_type
      if ('derivative_sources' in body)
        baseProjectData.derivative_sources = derivative_sources || []
      if ('category_id' in body) baseProjectData.category_id = category_id
      if ('license_id' in body) baseProjectData.license_id = license_id
      if ('cover_web' in body) baseProjectData.cover_web = cover_web
      if ('cover_mobile' in body) baseProjectData.cover_mobile = cover_mobile
      if ('gallery' in body) baseProjectData.gallery = gallery || []
      if ('machines_used' in body) baseProjectData.machines_used = machines_used
      if ('other_parts' in body) baseProjectData.other_parts = body.other_parts
      if ('visibility' in body)
        baseProjectData.visibility = visibility || 'private'

      let project
      if (isUpdate) {
        // 修改项目
        project = await tx.projects.update({
          where: { id },
          data: {
            ...baseProjectData,
            slug: id // 使用项目ID作为slug
          }
        })
      } else {
        // 新增项目，包含创建者ID和必要的默认值
        const createData = {
          ...baseProjectData,
          creator_id: user.id
        }

        // 新增项目时，为数组字段设置默认值（如果没有传递）
        if (!('derivative_sources' in body)) createData.derivative_sources = []
        if (!('gallery' in body)) createData.gallery = []
        if (!('visibility' in body)) createData.visibility = 'public'

        project = await tx.projects.create({
          data: createData
        })

        // 创建后更新slug为项目ID
        project = await tx.projects.update({
          where: { id: project.id },
          data: { slug: project.id }
        })
      }

      // 处理项目标签（只有在传递了 tag_ids 时才处理）
      if ('tag_ids' in body && Array.isArray(tag_ids)) {
        // 删除现有标签关联（修改模式）
        if (isUpdate) {
          await tx.projectTags.deleteMany({
            where: { project_id: project.id }
          })
        }

        // 创建新的标签关联（如果有标签的话）
        if (tag_ids.length > 0) {
          await tx.projectTags.createMany({
            data: tag_ids.map((tag_id: number) => ({
              project_id: project.id,
              tag_id
            }))
          })
        }
      }

      // 查询并返回更新后的完整项目信息
      const updatedProject = await tx.projects.findUnique({
        where: { id: project.id },
        include: {
          category: true,
          license: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              thumbnail: true
            }
          },
          project_tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      return updatedProject
    })

    if (!result) {
      return createErrorResponse(
        DATA_ERROR.QUERY_FAILED,
        'Failed to retrieve updated project data after operation.',
        null,
        500
      )
    }

    // 格式化响应数据，只返回请求中包含的字段
    const responseData: { [key: string]: any } = { id: result.id }
    for (const key in body) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        if (key === 'id') continue

        if (key === 'tag_ids') {
          responseData[key] = result.project_tags.map(pt => pt.tag.id)
        } else if (Object.prototype.hasOwnProperty.call(result, key)) {
          responseData[key] = (result as any)[key]
        }
      }
    }

    return createSuccessResponse(
      responseData,
      isUpdate ? 'Project updated successfully' : 'Project created successfully'
    )
  } catch (error) {
    console.error('Failed to create/update project:', error)
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create/update project',
      error,
      500
    )
  }
}

// const deleteProjectHandler: ApiHandler = async (request: NextRequest) => {
//   return {}
// }

export const GET = withApiHandler(getProjectHandler)
export const POST = withAuthenticatedApiHandler(projectHandler)
// export const DELETE = withApiHandler(deleteProjectHandler)
