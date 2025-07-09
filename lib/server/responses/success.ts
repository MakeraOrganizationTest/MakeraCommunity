import { NextResponse } from 'next/server'
import { ApiResponse, PaginatedResponse } from '../types'

/**
 * 创建成功的API响应
 * Create successful API response
 * @param data 响应数据 (Response data)
 * @param message 响应消息 (Response message)
 * @param code HTTP状态码 (HTTP status code)
 * @returns NextResponse对象 (NextResponse object)
 */
export function createSuccessResponse<T>(
  data: T,
  message = 'Operation successful',
  code = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    code,
    success: true,
    message,
    data,
    timestamp: Date.now()
  }

  // 处理BigInt序列化问题和ID转字符串
  const serializedResponse = JSON.parse(
    JSON.stringify(response, (key, value) => {
      // BigInt 转字符串
      if (typeof value === 'bigint') {
        return value.toString()
      }

      // ID 字段转字符串 (名为'id'或以'_id'结尾的字段)
      if ((key === 'id' || key.endsWith('_id')) && typeof value === 'number') {
        return value.toString()
      }

      return value
    })
  )

  return NextResponse.json(serializedResponse, { status: code })
}

/**
 * 创建分页数据响应
 * Create paginated data response
 * @param data 数据记录列表 (Data records list)
 * @param total 总记录数 (Total records count)
 * @param page 当前页码 (Current page number)
 * @param pageSize 每页大小 (Page size)
 * @param message 响应消息 (Response message)
 * @returns NextResponse对象 (NextResponse object)
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'Query successful'
): NextResponse<PaginatedResponse<T>> {
  const response: PaginatedResponse<T> = {
    code: 200,
    success: true,
    message,
    data: {
      data,
      total,
      page,
      pageSize
    },
    timestamp: Date.now()
  }

  // 处理BigInt序列化问题和ID转字符串
  const serializedResponse = JSON.parse(
    JSON.stringify(response, (key, value) => {
      // BigInt 转字符串
      if (typeof value === 'bigint') {
        return value.toString()
      }

      // ID 字段转字符串 (名为'id'或以'_id'结尾的字段)
      if ((key === 'id' || key.endsWith('_id')) && typeof value === 'number') {
        return value.toString()
      }

      return value
    })
  )

  return NextResponse.json(serializedResponse)
}
