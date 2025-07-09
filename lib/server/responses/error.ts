import { NextResponse } from 'next/server'
import { ApiErrorResponse } from '../types'
import {
  ERROR_CODES,
  COMMON_ERROR,
  HTTP_STATUS_TO_ERROR_CODE
} from '../../../constants/error-codes'
import { ErrorType } from '../types'

/**
 * 创建错误响应
 * Create error response
 * @param errorType 错误类型 (Error type)
 * @param message 自定义错误消息 (Custom error message)
 * @param errorDetail 错误详情 (Error details)
 * @param httpStatus HTTP状态码 (HTTP status code)
 * @returns NextResponse对象 (NextResponse object)
 */
export function createErrorResponse(
  errorType: ErrorType = COMMON_ERROR.UNKNOWN,
  message?: string,
  errorDetail?: any,
  httpStatus?: number
): NextResponse<ApiErrorResponse> {
  // 默认使用错误类型中的消息
  // Use the message from error type by default
  const errorMessage = message || errorType.message
  // 默认HTTP状态码为500
  // Default HTTP status code is 500
  const status = httpStatus || 500

  const response: ApiErrorResponse = {
    code: errorType.code,
    success: false,
    message: errorMessage,
    errorCode: errorType.code.toString(),
    errorDetail:
      process.env.NODE_ENV === 'development' ? errorDetail : undefined,
    data: null,
    timestamp: Date.now()
  }

  return NextResponse.json(response, { status })
}

/**
 * 根据HTTP状态码创建错误响应
 * Create error response based on HTTP status code
 * @param status HTTP状态码 (HTTP status code)
 * @param message 错误消息 (Error message)
 * @param errorDetail 错误详情 (Error details)
 * @returns NextResponse对象 (NextResponse object)
 */
export function createHttpErrorResponse(
  status = 500,
  message?: string,
  errorDetail?: any
): NextResponse<ApiErrorResponse> {
  // 根据HTTP状态码获取对应的错误码
  // Get the corresponding error code based on HTTP status code
  const errorCode =
    HTTP_STATUS_TO_ERROR_CODE[status] || COMMON_ERROR.UNKNOWN.code

  // 查找对应的错误类型
  // Find the corresponding error type
  const errorTypeFound = Object.values(ERROR_CODES).find(
    err => err.code === errorCode
  )
  const errorType: ErrorType = errorTypeFound || COMMON_ERROR.UNKNOWN

  return createErrorResponse(errorType, message, errorDetail, status)
}

/**
 * 从异常中创建错误响应
 * Create error response from exception
 * @param error 捕获的异常 (Caught exception)
 * @returns NextResponse对象 (NextResponse object)
 */
export function createErrorResponseFromException(
  error: any
): NextResponse<ApiErrorResponse> {
  console.error('API Exception:', error)

  // 处理已知的错误类型
  // Handle known error types
  if (error.code && typeof error.code === 'number') {
    // 查找对应的错误类型
    // Find the corresponding error type
    const errorTypeFound = Object.values(ERROR_CODES).find(
      err => err.code === error.code
    )
    if (errorTypeFound) {
      return createErrorResponse(
        errorTypeFound,
        error.message,
        error,
        error.status || 500
      )
    }
  }

  // 处理HTTP错误
  // Handle HTTP errors
  if (error.status && typeof error.status === 'number') {
    return createHttpErrorResponse(error.status, error.message, error)
  }

  // 默认为系统错误
  // Default to system error
  return createErrorResponse(COMMON_ERROR.SYSTEM_ERROR, error.message, error)
}
