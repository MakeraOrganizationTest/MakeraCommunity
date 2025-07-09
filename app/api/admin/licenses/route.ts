import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withApiHandler,
  ApiHandler,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  DATA_ERROR
} from '@/lib/server'
import { Prisma } from '@/generated/prisma'

/**
 * 获取许可证列表或单个许可证详情
 */
const getLicensesHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // 检查是否请求单个许可证
  const id = searchParams.get('id')
  if (id) {
    try {
      // 获取许可证基本信息
      const license = await prisma.licenses.findUnique({
        where: { id }
      })

      if (!license) {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'License not found',
          null,
          404
        )
      }

      // 返回许可证详情
      return createSuccessResponse(
        license,
        'License details retrieved successfully'
      )
    } catch (error) {
      return createErrorResponse(
        DATA_ERROR.QUERY_FAILED,
        'Failed to retrieve license details',
        error,
        500
      )
    }
  }

  // 获取许可证列表
  const page = searchParams.get('page')
    ? parseInt(searchParams.get('page') as string)
    : 1
  const pageSize = searchParams.get('pageSize')
    ? parseInt(searchParams.get('pageSize') as string)
    : 10
  const searchTerm = searchParams.get('searchTerm') || ''
  const isActive = searchParams.get('isActive')

  // 计算分页
  const skip = (page - 1) * pageSize
  const take = pageSize

  // 构建查询条件
  const where: Prisma.LicensesWhereInput = {}

  // 应用搜索过滤
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { code: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } }
    ]
  }

  // 应用状态过滤
  if (isActive === 'true' || isActive === 'false') {
    where.is_active = isActive === 'true'
  }

  try {
    // 获取总记录数
    const count = await prisma.licenses.count({ where })

    // 获取许可证列表
    const licenses = await prisma.licenses.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' }
    })

    // 返回分页数据
    return createPaginatedResponse(
      licenses,
      count,
      page,
      pageSize,
      'Licenses list retrieved successfully'
    )
  } catch (error) {
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to retrieve licenses list',
      error,
      500
    )
  }
}

/**
 * 创建新许可证
 */
const createLicenseHandler: ApiHandler = async (request: NextRequest) => {
  // 获取请求体
  let body
  try {
    body = await request.json()
  } catch (error) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Invalid request data',
      error,
      400
    )
  }

  const { name, description, thumbnail, code, is_active } = body

  // 验证必填字段
  if (!name || !code || !description) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing required fields',
      null,
      400
    )
  }

  try {
    // 创建新许可证
    const newLicense = await prisma.licenses.create({
      data: {
        name,
        code,
        description,
        thumbnail,
        is_active: is_active !== undefined ? is_active : true
      }
    })

    return createSuccessResponse(newLicense, 'License created successfully')
  } catch (error) {
    // 检查是否为唯一性约束错误
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'License name or slug already exists',
          error,
          409
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create license',
      error,
      500
    )
  }
}

/**
 * 更新许可证信息
 */
const updateLicenseHandler: ApiHandler = async (request: NextRequest) => {
  // 获取请求体
  let body
  try {
    body = await request.json()
  } catch (error) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Invalid request data',
      error,
      400
    )
  }

  const { id, ...licenseData } = body

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing license ID',
      null,
      400
    )
  }

  try {
    // 检查许可证是否存在
    const license = await prisma.licenses.findUnique({
      where: { id }
    })

    if (!license) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'License not found',
        null,
        404
      )
    }

    // 更新许可证
    const updatedLicense = await prisma.licenses.update({
      where: { id },
      data: {
        ...licenseData,
        updated_at: new Date()
      }
    })

    return createSuccessResponse(updatedLicense, 'License updated successfully')
  } catch (error) {
    // 检查是否为唯一性约束错误
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'License name or slug already exists',
          error,
          409
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to update license',
      error,
      500
    )
  }
}

/**
 * 删除许可证
 */
const deleteLicenseHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing license ID',
      null,
      400
    )
  }

  try {
    // 检查许可证是否存在
    const license = await prisma.licenses.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true
          },
          take: 1
        }
      }
    })

    if (!license) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'License not found',
        null,
        404
      )
    }

    // 检查是否有关联的模型
    if (license.projects.length > 0) {
      return createErrorResponse(
        DATA_ERROR.UPDATE_FAILED,
        'License is in use and cannot be deleted',
        null,
        400
      )
    }

    // 删除许可证
    await prisma.licenses.delete({
      where: { id }
    })

    return createSuccessResponse({ id }, 'License deleted successfully')
  } catch (error) {
    return createErrorResponse(
      DATA_ERROR.DELETE_FAILED,
      'Failed to delete license',
      error,
      500
    )
  }
}

// 导出处理函数，使用API中间件包装
export const GET = withApiHandler(getLicensesHandler)
export const POST = withApiHandler(createLicenseHandler)
export const PUT = withApiHandler(updateLicenseHandler)
export const DELETE = withApiHandler(deleteLicenseHandler)
