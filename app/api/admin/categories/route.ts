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
 * /api/admin/categories:
 *   get:
 *     tags:
 *       - Admin
 *     summary: 获取项目分类列表或单个分类详情
 *     description: 获取项目分类列表或单个分类详情，支持分页、搜索，可返回树形结构
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: false
 *         description: 分类ID，传入此参数时返回单个分类详情
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
 *         description: 搜索关键词，支持按分类名称、描述搜索
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: 分类类型过滤
 *       - in: query
 *         name: tree
 *         schema:
 *           type: boolean
 *           default: false
 *         required: false
 *         description: 是否返回树形结构
 *     responses:
 *       200:
 *         description: 分类列表或单个分类详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: 单个分类详情响应
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
 *                         description:
 *                           type: string
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
 *                   description: 分类列表分页响应（平铺或树形）
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
 *                           description:
 *                             type: string
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
 *                             description: 子分类（仅在tree=true时存在）
 *                             items:
 *                               $ref: '#/components/schemas/Category'
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
 *         description: 分类不存在（仅在请求单个分类时）
 *       500:
 *         description: 获取分类信息失败
 */

/**
 * 获取模型列表或单个模型
 */
const getCategoryHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // 检查是否请求单个模型分类
  const id = searchParams.get('id')
  if (id) {
    const category = await prisma.projectCategories.findUnique({
      where: { id: parseInt(id) }
    })

    if (!category) {
      return createErrorResponse(
        DATA_ERROR.NOT_FOUND,
        'Category not found',
        null,
        404
      )
    }

    return createSuccessResponse(category)
  }

  // 获取模型分类列表
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
  const where: Prisma.ProjectCategoriesWhereInput = {}

  // 应用搜索过滤
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } }
    ]
  }

  try {
    // 获取总记录数
    const count = await prisma.projectCategories.count({ where })

    // 获取数据
    const data = await prisma.projectCategories.findMany({
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
        'Category tree retrieved successfully'
      )
    }

    return createPaginatedResponse(
      data,
      count,
      page,
      pageSize,
      'Categories list retrieved successfully'
    )
  } catch (error) {
    console.log(error)
    return createErrorResponse(
      DATA_ERROR.QUERY_FAILED,
      'Failed to query categories',
      error,
      500
    )
  }
}

/**
 * 创建新分类
 */
/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     tags:
 *       - Admin
 *     summary: 创建新项目分类
 *     description: 创建新的项目分类，支持层级结构
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
 *                 description: 分类名称
 *               description:
 *                 type: string
 *                 description: 分类描述
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: 父分类ID
 *     responses:
 *       201:
 *         description: 分类创建成功
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
 *                     description:
 *                       type: string
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
 *         description: 分类代码已存在
 *       500:
 *         description: 创建分类失败
 */
const createCategoryHandler: ApiHandler = async (request: NextRequest) => {
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
    // 创建模型分类
    const data = await prisma.projectCategories.create({
      data: body
    })

    return createSuccessResponse(data, 'Categories created successfully', 201)
  } catch (error) {
    console.error(
      'create category error: ',
      error instanceof Error ? error.message : String(error)
    )
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 唯一性约束错误
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'Categories code already exists',
          error,
          409
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.CREATE_FAILED,
      'Failed to create category',
      error,
      500
    )
  }
}

/**
 * 更新
 */
/**
 * @swagger
 * /api/admin/categories:
 *   put:
 *     tags:
 *       - Admin
 *     summary: 更新项目分类信息
 *     description: 更新项目分类信息，如果分类有子分类且要修改父分类，会被阻止
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
 *                 description: 分类ID
 *               name:
 *                 type: string
 *                 description: 分类名称
 *               description:
 *                 type: string
 *                 description: 分类描述
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: 父分类ID
 *     responses:
 *       200:
 *         description: 分类信息更新成功
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
 *                     description:
 *                       type: string
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
 *         description: 分类不存在
 *       409:
 *         description: 分类代码已存在或存在子分类不能修改父分类
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
 *                     childrenCount:
 *                       type: integer
 *                       description: 子分类数量
 *       500:
 *         description: 更新分类信息失败
 */
const updateCategoryHandler: ApiHandler = async (request: NextRequest) => {
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

  const { id, ...categoryData } = body

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing category ID',
      null,
      400
    )
  }

  try {
    // 先检查是否有子模型分类，如果有，则不能更新Parent_id
    const childrenCount = await prisma.projectCategories.count({
      where: { parent_id: parseInt(id) }
    })

    if (childrenCount > 0 && categoryData.parent_id !== null) {
      return createErrorResponse(
        DATA_ERROR.UPDATE_FAILED,
        'Cannot update category: Child categories exist. Please change the Parent of all child categories first',
        { childrenCount },
        409
      )
    }

    // 更新模型分类
    const data = await prisma.projectCategories.update({
      where: { id: parseInt(id) },
      data: categoryData
    })

    return createSuccessResponse(data, 'Categories updated successfully')
  } catch (error) {
    console.error(
      'update category error: ',
      error instanceof Error ? error.message : String(error)
    )
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 唯一性约束错误
      if (error.code === 'P2002') {
        return createErrorResponse(
          DATA_ERROR.DUPLICATE_ENTRY,
          'Categories code already exists',
          error,
          409
        )
      }
      // 记录不存在
      if (error.code === 'P2025') {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Categories not found',
          error,
          404
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.UPDATE_FAILED,
      'Failed to update category',
      error,
      500
    )
  }
}

/**
 * 删除模型分类
 */
/**
 * @swagger
 * /api/admin/categories:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: 删除项目分类
 *     description: 删除项目分类，如果存在子分类，将无法删除
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 分类删除成功
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
 *                       description: 已删除的分类ID
 *       400:
 *         description: 分类ID参数未提供
 *       404:
 *         description: 分类不存在
 *       409:
 *         description: 分类存在子分类，无法删除
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
 *                     childrenCount:
 *                       type: integer
 *                       description: 子分类数量
 *       500:
 *         description: 删除分类失败
 */
const deleteCategoryHandler: ApiHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return createErrorResponse(
      DATA_ERROR.VALIDATION_FAILED,
      'Missing category ID',
      null,
      400
    )
  }

  const parsedId = parseInt(id)

  try {
    // 先检查是否有子模型分类
    const childrenCount = await prisma.projectCategories.count({
      where: { parent_id: parsedId }
    })

    if (childrenCount > 0) {
      return createErrorResponse(
        DATA_ERROR.DELETE_FAILED,
        'Cannot delete category: Child categories exist. Please delete all child categories first',
        { childrenCount },
        409
      )
    }

    // 删除模型分类
    await prisma.projectCategories.delete({
      where: { id: parsedId }
    })

    return createSuccessResponse(
      { id: parsedId },
      'Categories deleted successfully'
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 记录不存在
      if (error.code === 'P2025') {
        return createErrorResponse(
          DATA_ERROR.NOT_FOUND,
          'Categories not found',
          error,
          404
        )
      }
    }
    return createErrorResponse(
      DATA_ERROR.DELETE_FAILED,
      'Failed to delete category',
      error,
      500
    )
  }
}

// 导出处理函数，使用API中间件包装
export const GET = withApiHandler(getCategoryHandler)
export const POST = withApiHandler(createCategoryHandler)
export const PUT = withApiHandler(updateCategoryHandler)
export const DELETE = withApiHandler(deleteCategoryHandler)
