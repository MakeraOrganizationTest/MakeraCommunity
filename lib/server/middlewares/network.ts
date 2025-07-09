import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '../responses/error'
import { COMMON_ERROR } from '../../../constants/error-codes'
import { ApiMiddleware } from '../types'

/**
 * CORS中间件
 * 处理跨域资源共享
 */
export const corsMiddleware: ApiMiddleware = async (
  req: NextRequest,
  next: () => Promise<NextResponse>
) => {
  // 允许的域名列表
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000']

  // 获取请求来源
  const origin = req.headers.get('origin') || ''

  // 检查是否是OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })

    // 设置CORS头部
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    )
    response.headers.set('Access-Control-Max-Age', '86400') // 24小时缓存预检请求结果

    // 仅允许特定域名
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
  }

  // 处理实际请求
  const response = await next()

  // 仅允许特定域名
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

/**
 * 速率限制中间件
 * 限制API请求频率
 */
export const rateLimitMiddleware: ApiMiddleware = async (
  req: NextRequest,
  next: () => Promise<NextResponse>
) => {
  // 获取客户端IP
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  // 获取当前时间
  const now = Date.now()

  // 请求路径
  const path = new URL(req.url).pathname

  // 限制键（IP + 路径）
  const key = `${ip}:${path}`

  // 内存中存储请求次数的简单实现，实际生产环境应使用Redis等
  const requestCounts: Record<string, { count: number; resetTime: number }> =
    (global as any).__requestCounts || {}

  // 初始化全局存储
  if (!(global as any).__requestCounts) {
    ;(global as any).__requestCounts = requestCounts
  }

  // 默认限制：每分钟60次请求
  const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 60
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000

  // 如果键不存在或已过期，初始化
  if (!requestCounts[key] || requestCounts[key].resetTime < now) {
    requestCounts[key] = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  // 递增请求计数
  requestCounts[key].count += 1

  // 如果超过限制，返回错误
  if (requestCounts[key].count > maxRequests) {
    return createErrorResponse(
      COMMON_ERROR.RATE_LIMIT,
      `请求频率超限，请等待${Math.ceil(
        (requestCounts[key].resetTime - now) / 1000
      )}秒后再试`,
      null,
      429
    )
  }

  // 设置请求剩余次数和重置时间的响应头
  const response = await next()
  response.headers.set('X-RateLimit-Limit', maxRequests.toString())
  response.headers.set(
    'X-RateLimit-Remaining',
    (maxRequests - requestCounts[key].count).toString()
  )
  response.headers.set(
    'X-RateLimit-Reset',
    Math.ceil(requestCounts[key].resetTime / 1000).toString()
  )

  return response
}
