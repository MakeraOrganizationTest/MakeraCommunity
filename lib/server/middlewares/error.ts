import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponseFromException, createHttpErrorResponse } from '../responses/error';
import { ApiMiddleware } from '../types';

/**
 * 错误处理中间件
 * 捕获并处理API处理过程中的错误
 */
export const errorHandlerMiddleware: ApiMiddleware = async (req: NextRequest, next: () => Promise<NextResponse>) => {
  try {
    // 继续处理请求
    return await next();
  } catch (error: any) {
    console.error('API错误:', error);
    
    // 根据错误类型返回不同的错误响应
    if (error.status) {
      return createHttpErrorResponse(error.status, error.message, error);
    }
    
    return createErrorResponseFromException(error);
  }
};

/**
 * 请求验证中间件
 * 验证请求是否包含必要的参数或格式是否正确
 * @param validator 验证函数
 */
export const validationMiddleware = (
  validator: (req: NextRequest) => { isValid: boolean; errors?: string[] }
): ApiMiddleware => {
  return async (req: NextRequest, next: () => Promise<NextResponse>) => {
    // 执行验证
    const { isValid, errors } = validator(req);
    
    // 如果验证失败，返回错误响应
    if (!isValid) {
      return createHttpErrorResponse(
        400,
        '请求验证失败',
        { errors }
      );
    }
    
    // 继续处理请求
    return next();
  };
}; 