import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/types/user'

/**
 * API中间件类型定义
 * API middleware type definition
 * 处理请求并调用下一个中间件或处理器
 * Processes the request and calls the next middleware or handler
 */
export type ApiMiddleware = (
  req: NextRequest,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>

/**
 * API请求处理器类型定义
 * API request handler type definition
 * 处理请求并返回响应
 * Processes the request and returns a response
 */
export type ApiHandler = (req: NextRequest) => Promise<NextResponse>

/**
 * 带用户认证的API请求处理器类型定义
 * Authenticated API request handler type definition
 * 处理请求并返回响应，同时提供已认证的用户信息
 * Processes the request and returns a response with authenticated user info
 */
export type AuthenticatedApiHandler = (
  req: NextRequest,
  user: User
) => Promise<NextResponse>

/**
 * API错误类型接口
 * API error type interface
 */
export interface ErrorType {
  code: number
  message: string
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  code: number // 状态码
  success: boolean // 请求是否成功
  message: string // 响应消息
  data?: T | null // 响应数据（可选，可为null）
  timestamp: number // 响应时间戳
  errorCode?: string // 错误代码（可选，仅在错误响应中存在）
  errorDetail?: any // 错误详情（可选，用于调试）
}

/**
 * 分页数据响应接口
 */
export interface PaginatedResponse<T = any>
  extends ApiResponse<{
    data: T[] // 数据记录列表
    total: number // 总记录数
    page: number // 当前页码
    pageSize: number // 每页大小
  }> {}

/**
 * API错误响应接口
 */
export interface ApiErrorResponse extends ApiResponse<null> {
  errorCode: string // 错误代码
  errorDetail?: any // 错误详情（可选，用于调试）
}

/**
 * 基础查询参数接口
 */
export interface BaseQueryParams {
  page?: number // 页码
  pageSize?: number // 页大小
  searchTerm?: string // 搜索关键词
  sortBy?: string // 排序字段
  sortOrder?: 'asc' | 'desc' // 排序方向
}
