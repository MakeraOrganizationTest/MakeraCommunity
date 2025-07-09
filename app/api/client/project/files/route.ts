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

/**
 * @swagger
 * /api/client/project/files:
 *   get:
 *     tags:
 *       - Client
 *     summary: 获取项目文件列表
 *     description: 根据项目ID获取项目文件列表
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *         required: true
 *         description: 项目ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: 文件列表获取成功
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
 *                   example: "Project files retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "file-uuid"
 *                       name:
 *                         type: string
 *                         example: "桌面CNC配置文件"
 *                       description:
 *                         type: string
 *                         example: "适用于桌面级CNC的配置文件"
 *                       file_path:
 *                         type: string
 *                         example: "/files/project/config.mkc"
 *                       file_size:
 *                         type: integer
 *                         example: 2048576
 *                       file_type:
 *                         type: string
 *                         example: "mkc"
 *                       thumbnail:
 *                         type: string
 *                         example: "https://example.com/thumbnail.jpg"
 *                       preview_model_path:
 *                         type: string
 *                         example: "/files/preview/model.stl"
 *                       order:
 *                         type: integer
 *                         example: 1
 *                       cutters:
 *                         type: array
 *                         example: [[{"name": "6mm平底刀", "id": "cutter-uuid"}, {"name": "3mm雕刻刀", "id": "cutter-uuid-2"}], [{"name": "钻头", "id": "cutter-uuid-3"}]]
 *                       blank:
 *                         type: array
 *                         example: [{"name": "实木板材", "id": "material-uuid"}, {"name": "MDF板", "id": "material-uuid-2"}]
 *                       parameters:
 *                         type: object
 *                         example: {"speed": 12000, "feed": 1000}
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-15T10:30:00.000Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-15T10:30:00.000Z"
 *   post:
 *     tags:
 *       - Client
 *     summary: 新增项目文件
 *     description: 为指定项目添加新的文件
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
 *               - name
 *               - file_path
 *               - file_size
 *               - file_type
 *             properties:
 *               project_id:
 *                 type: string
 *                 description: 项目ID
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               name:
 *                 type: string
 *                 description: 文件名称
 *                 example: "桌面CNC配置文件"
 *               description:
 *                 type: string
 *                 description: 文件描述
 *                 example: "适用于桌面级CNC的配置文件"
 *               file_path:
 *                 type: string
 *                 description: 文件存储路径
 *                 example: "/files/project/config.mkc"
 *               file_size:
 *                 type: integer
 *                 description: 文件大小(字节)
 *                 example: 2048576
 *               file_type:
 *                 type: string
 *                 description: 文件类型/扩展名
 *                 example: "mkc"
 *               thumbnail:
 *                 type: string
 *                 description: 缩略图路径
 *                 example: "https://example.com/thumbnail.jpg"
 *               preview_model_path:
 *                 type: string
 *                 description: 预览模型路径
 *                 example: "/files/preview/model.stl"
 *               order:
 *                 type: integer
 *                 description: 排序
 *                 example: 1
 *               cutters:
 *                 type: array
 *                 description: 刀具清单信息
 *                 example: [[{"name": "6mm平底刀", "id": "cutter-uuid"}, {"name": "3mm雕刻刀", "id": "cutter-uuid-2"}], [{"name": "钻头", "id": "cutter-uuid-3"}]]
 *               blank:
 *                 type: array
 *                 description: 毛坯材料
 *                 example: [{"name": "实木板材", "id": "material-uuid"}, {"name": "MDF板", "id": "material-uuid-2"}]
 *               parameters:
 *                 type: object
 *                 description: 其他参数
 *                 example: {"speed": 12000, "feed": 1000}
 *     responses:
 *       201:
 *         description: 文件创建成功
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
 *                   example: "Project file created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "file-uuid"
 *                     project_id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     name:
 *                       type: string
 *                       example: "桌面CNC配置文件"
 *                     description:
 *                       type: string
 *                       example: "适用于桌面级CNC的配置文件"
 *                     file_path:
 *                       type: string
 *                       example: "/files/project/config.mkc"
 *                     file_size:
 *                       type: integer
 *                       example: 2048576
 *                     file_type:
 *                       type: string
 *                       example: "mkc"
 *                     thumbnail:
 *                       type: string
 *                       example: "https://example.com/thumbnail.jpg"
 *                     preview_model_path:
 *                       type: string
 *                       example: "/files/preview/model.stl"
 *                     order:
 *                       type: integer
 *                       example: 1
 *                     cutters:
 *                       type: array
 *                       example: [[{"name": "6mm平底刀", "id": "cutter-uuid"}, {"name": "3mm雕刻刀", "id": "cutter-uuid-2"}], [{"name": "钻头", "id": "cutter-uuid-3"}]]
 *                     blank:
 *                       type: array
 *                       example: [{"name": "实木板材", "id": "material-uuid"}, {"name": "MDF板", "id": "material-uuid-2"}]
 *                     parameters:
 *                       type: object
 *                       example: {"speed": 12000, "feed": 1000}
 *   put:
 *     tags:
 *       - Client
 *     summary: 修改项目文件信息
 *     description: 修改指定项目文件的信息
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
 *             properties:
 *               id:
 *                 type: string
 *                 description: 文件ID
 *                 example: "file-uuid"
 *               name:
 *                 type: string
 *                 description: 文件名称
 *                 example: "桌面CNC配置文件"
 *               description:
 *                 type: string
 *                 description: 文件描述
 *                 example: "适用于桌面级CNC的配置文件"
 *               thumbnail:
 *                 type: string
 *                 description: 缩略图路径
 *                 example: "https://example.com/thumbnail.jpg"
 *               preview_model_path:
 *                 type: string
 *                 description: 预览模型路径
 *                 example: "/files/preview/model.stl"
 *               order:
 *                 type: integer
 *                 description: 排序
 *                 example: 1
 *               cutters:
 *                 type: array
 *                 description: 刀具清单信息
 *                 example: [[{"name": "6mm平底刀", "id": "cutter-uuid"}, {"name": "3mm雕刻刀", "id": "cutter-uuid-2"}], [{"name": "钻头", "id": "cutter-uuid-3"}]]
 *               blank:
 *                 type: array
 *                 description: 毛坯材料
 *                 example: [{"name": "实木板材", "id": "material-uuid"}, {"name": "MDF板", "id": "material-uuid-2"}]
 *               parameters:
 *                 type: object
 *                 description: 其他参数
 *                 example: {"speed": 12000, "feed": 1000}
 *     responses:
 *       200:
 *         description: 文件修改成功
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
 *                   example: "Project file updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 文件ID
 *                       example: "file-uuid"
 *                     name:
 *                       type: string
 *                       description: 文件名称
 *                       example: "桌面CNC配置文件"
 *                     description:
 *                       type: string
 *                       description: 文件描述
 *                       example: "适用于桌面级CNC的配置文件"
 *                     thumbnail:
 *                       type: string
 *                       description: 缩略图路径
 *                       example: "https://example.com/thumbnail.jpg"
 *                     preview_model_path:
 *                       type: string
 *                       description: 预览模型路径
 *                       example: "/files/preview/model.stl"
 *                     order:
 *                       type: integer
 *                       description: 排序
 *                       example: 1
 *                     cutters:
 *                       type: array
 *                       description: 刀具清单信息
 *                       example: [[{"name": "6mm平底刀", "id": "cutter-uuid"}, {"name": "3mm雕刻刀", "id": "cutter-uuid-2"}], [{"name": "钻头", "id": "cutter-uuid-3"}]]
 *                     blank:
 *                       type: array
 *                       description: 毛坯材料
 *                       example: [{"name": "实木板材", "id": "material-uuid"}, {"name": "MDF板", "id": "material-uuid-2"}]
 *                     parameters:
 *                       type: object
 *                       description: 其他参数
 *                       example: {"speed": 12000, "feed": 1000}
 *   delete:
 *     tags:
 *       - Client
 *     summary: 删除项目文件
 *     description: 删除指定的项目文件
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 文件ID
 *         example: "file-uuid"
 *     responses:
 *       200:
 *         description: 文件删除成功
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
 *                   example: "Project file deleted successfully"
 */

// GET - 获取项目文件列表
const getProjectFilesHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Project ID is required',
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

    // 获取项目文件列表
    const files = await prisma.projectFiles.findMany({
      where: { project_id: projectId },
      orderBy: [{ order: 'asc' }, { created_at: 'asc' }]
    })

    // 转换 BigInt 为 number
    const formattedFiles = files.map(file => ({
      ...file,
      file_size: Number(file.file_size)
    }))

    return createSuccessResponse(
      formattedFiles,
      'Project files retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve project files:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve project files',
      error,
      500
    )
  }
}

// POST - 新增项目文件
const createProjectFileHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const {
      project_id,
      name,
      description,
      file_path,
      file_size,
      file_type,
      thumbnail,
      preview_model_path,
      order,
      cutters,
      blank,
      parameters
    } = body

    // 验证必填字段
    if (!project_id || !name || !file_path || !file_size || !file_type) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'project_id, name, file_path, file_size, and file_type are required',
        null,
        400
      )
    }

    // 验证项目是否存在且用户有权限
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

    if (project.creator_id !== user.id) {
      return createErrorResponse(
        AUTH_ERROR.FORBIDDEN,
        'You do not have permission to add files to this project',
        null,
        403
      )
    }

    // 创建文件记录
    const file = await prisma.projectFiles.create({
      data: {
        project_id,
        name,
        description,
        file_path,
        file_size: BigInt(file_size),
        file_type,
        thumbnail,
        preview_model_path,
        order,
        cutters,
        blank,
        parameters
      }
    })

    const responseData = {
      ...body,
      id: file.id
    }

    return createSuccessResponse(
      responseData,
      'Project file created successfully'
    )
  } catch (error) {
    console.error('Failed to create project file:', error)
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create project file',
      error,
      500
    )
  }
}

// PUT - 修改项目文件信息
const updateProjectFileHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      thumbnail,
      preview_model_path,
      order,
      cutters,
      blank,
      parameters
    } = body

    // 验证必填字段
    if (!id) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'File ID is required',
        null,
        400
      )
    }

    // 验证文件是否存在且用户有权限
    const file = await prisma.projectFiles.findUnique({
      where: { id },
      include: {
        project: true
      }
    })

    if (!file) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Project file not found',
        null,
        404
      )
    }

    if (file.project.creator_id !== user.id) {
      return createErrorResponse(
        AUTH_ERROR.FORBIDDEN,
        'You do not have permission to modify this file',
        null,
        403
      )
    }

    // 准备更新数据
    const updateData = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(preview_model_path !== undefined && { preview_model_path }),
      ...(order !== undefined && { order }),
      ...(cutters !== undefined && { cutters }),
      ...(blank !== undefined && { blank }),
      ...(parameters !== undefined && { parameters }),
      updated_at: new Date()
    }

    // 更新文件信息
    await prisma.projectFiles.update({
      where: { id },
      data: updateData
    })

    return createSuccessResponse(body, 'Project file updated successfully')
  } catch (error) {
    console.error('Failed to update project file:', error)
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to update project file',
      error,
      500
    )
  }
}

// DELETE - 删除项目文件
const deleteProjectFileHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('id')

  if (!fileId) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'File ID is required',
      null,
      400
    )
  }

  try {
    // 验证文件是否存在且用户有权限
    const file = await prisma.projectFiles.findUnique({
      where: { id: fileId },
      include: {
        project: true
      }
    })

    if (!file) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Project file not found',
        null,
        404
      )
    }

    if (file.project.creator_id !== user.id) {
      return createErrorResponse(
        AUTH_ERROR.FORBIDDEN,
        'You do not have permission to delete this file',
        null,
        403
      )
    }

    // 删除文件记录
    await prisma.projectFiles.delete({
      where: { id: fileId }
    })

    return createSuccessResponse(null, 'Project file deleted successfully')
  } catch (error) {
    console.error('Failed to delete project file:', error)
    return createErrorResponse(
      DATA_ERROR.DELETE_FAILED,
      'Failed to delete project file',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getProjectFilesHandler)
export const POST = withAuthenticatedApiHandler(createProjectFileHandler)
export const PUT = withAuthenticatedApiHandler(updateProjectFileHandler)
export const DELETE = withAuthenticatedApiHandler(deleteProjectFileHandler)
