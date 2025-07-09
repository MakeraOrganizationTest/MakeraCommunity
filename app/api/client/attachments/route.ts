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

// GET - 获取项目附件列表
const getProjectAttachmentsHandler: ApiHandler = async (
  request: NextRequest
) => {
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
    // 获取附件列表
    const attachments = await prisma.projectAttachments.findMany({
      where: { project_id: projectId },
      orderBy: [{ created_at: 'asc' }]
    })
    // BigInt 转 number
    const formatted = attachments.map(att => ({
      ...att,
      file_size: Number(att.file_size)
    }))
    return createSuccessResponse(
      formatted,
      'Project attachments retrieved successfully'
    )
  } catch (error) {
    console.error('Failed to retrieve project attachments:', error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve project attachments',
      error,
      500
    )
  }
}

// POST - 新增项目附件
const createProjectAttachmentHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const { project_id, name, description, file_path, file_size, file_type } =
      body
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
        'You do not have permission to add attachments to this project',
        null,
        403
      )
    }
    // 创建附件
    const attachment = await prisma.projectAttachments.create({
      data: {
        project_id,
        name,
        description,
        file_path,
        file_size: BigInt(file_size),
        file_type
      }
    })
    const responseData = {
      ...body,
      id: attachment.id
    }
    return createSuccessResponse(
      responseData,
      'Project attachment created successfully'
    )
  } catch (error) {
    console.error('Failed to create project attachment:', error)
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create project attachment',
      error,
      500
    )
  }
}

// PUT - 修改项目附件
const updateProjectAttachmentHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  try {
    const body = await request.json()
    const { id, name, description } = body
    if (!id) {
      return createErrorResponse(
        DATA_ERROR.VALIDATION_FAILED,
        'Attachment ID is required',
        null,
        400
      )
    }
    // 验证附件是否存在且用户有权限
    const attachment = await prisma.projectAttachments.findUnique({
      where: { id },
      include: { project: true }
    })
    if (!attachment) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Project attachment not found',
        null,
        404
      )
    }
    if (attachment.project.creator_id !== user.id) {
      return createErrorResponse(
        AUTH_ERROR.FORBIDDEN,
        'You do not have permission to modify this attachment',
        null,
        403
      )
    }
    // 更新数据
    const updateData = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      updated_at: new Date()
    }
    await prisma.projectAttachments.update({
      where: { id },
      data: updateData
    })
    return createSuccessResponse(
      body,
      'Project attachment updated successfully'
    )
  } catch (error) {
    console.error('Failed to update project attachment:', error)
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to update project attachment',
      error,
      500
    )
  }
}

// DELETE - 删除项目附件
const deleteProjectAttachmentHandler: AuthenticatedApiHandler = async (
  request: NextRequest,
  user: User
) => {
  const { searchParams } = new URL(request.url)
  const attachmentId = searchParams.get('id')
  if (!attachmentId) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Attachment ID is required',
      null,
      400
    )
  }
  try {
    // 验证附件是否存在且用户有权限
    const attachment = await prisma.projectAttachments.findUnique({
      where: { id: attachmentId },
      include: { project: true }
    })
    if (!attachment) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Project attachment not found',
        null,
        404
      )
    }
    if (attachment.project.creator_id !== user.id) {
      return createErrorResponse(
        AUTH_ERROR.FORBIDDEN,
        'You do not have permission to delete this attachment',
        null,
        403
      )
    }
    await prisma.projectAttachments.delete({
      where: { id: attachmentId }
    })
    return createSuccessResponse(
      null,
      'Project attachment deleted successfully'
    )
  } catch (error) {
    console.error('Failed to delete project attachment:', error)
    return createErrorResponse(
      DATA_ERROR.DELETE_FAILED,
      'Failed to delete project attachment',
      error,
      500
    )
  }
}

export const GET = withApiHandler(getProjectAttachmentsHandler)
export const POST = withAuthenticatedApiHandler(createProjectAttachmentHandler)
export const PUT = withAuthenticatedApiHandler(updateProjectAttachmentHandler)
export const DELETE = withAuthenticatedApiHandler(
  deleteProjectAttachmentHandler
)
