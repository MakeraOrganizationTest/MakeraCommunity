import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '../types';

/**
 * 日志颜色常量
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

/**
 * 日志中间件
 * 记录API请求和响应信息
 */
export const loggerMiddleware: ApiMiddleware = async (req: NextRequest, next: () => Promise<NextResponse>) => {
  const startTime = performance.now();
  const method = req.method;
  const url = req.url;
  const path = new URL(url).pathname;
  const queryParams = Object.fromEntries(new URL(url).searchParams);
  
  // 生成请求ID
  const requestId = generateRequestId();
  
  // 添加请求ID到请求头
  req.headers.set('x-request-id', requestId);
  
  // 获取用户IP和User-Agent
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // 根据HTTP方法设置颜色
  const methodColor = getMethodColor(method);
  
  // 请求开始日志
  console.log(`${colors.cyan}🚀 [${requestId}]${colors.reset} ${colors.dim}${new Date().toISOString()}${colors.reset} | ${methodColor}${method}${colors.reset} ${colors.bright}${path}${colors.reset} | ${colors.blue}开始请求${colors.reset}`);
  console.log(`${colors.cyan}📄 [${requestId}]${colors.reset} 请求信息: ${colors.yellow}IP=${ip}${colors.reset} | ${colors.yellow}UA=${userAgent.substring(0, 50)}${userAgent.length > 50 ? '...' : ''}${colors.reset}`);
  
  if (Object.keys(queryParams).length > 0) {
    console.log(`${colors.cyan}🔍 [${requestId}]${colors.reset} 查询参数:`, queryParams);
  }
  
  try {
    // 继续处理请求
    const response = await next();
    
    const duration = Math.round(performance.now() - startTime);
    const status = response.status;
    
    // 添加请求ID到响应头
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-response-time', `${duration}ms`);
    
    // 状态码分类和颜色
    const { icon, statusColor } = getStatusInfo(status);
    
    console.log(`${statusColor}${icon} [${requestId}]${colors.reset} ${colors.dim}${new Date().toISOString()}${colors.reset} | ${methodColor}${method}${colors.reset} ${colors.bright}${path}${colors.reset} | 状态: ${statusColor}${status}${colors.reset} | 耗时: ${getDurationColor(duration)}${duration}ms${colors.reset}`);
    
    return response;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    console.error(`${colors.red}❌ [${requestId}]${colors.reset} ${colors.dim}${new Date().toISOString()}${colors.reset} | ${methodColor}${method}${colors.reset} ${colors.bright}${path}${colors.reset} | ${colors.bgRed}${colors.white} 请求失败 ${colors.reset} | 耗时: ${getDurationColor(duration)}${duration}ms${colors.reset}`);
    console.error(`${colors.red}🔥 [${requestId}]${colors.reset} 错误详情: ${colors.bright}${colors.red}${error.message || error}${colors.reset}`);
    
    if (error.stack) {
      console.error(`${colors.red}📋 [${requestId}]${colors.reset} 错误堆栈: ${colors.dim}${error.stack}${colors.reset}`);
    }
    
    throw error;
  }
};

/**
 * 性能监控中间件
 * 记录API性能指标
 */
export const performanceMiddleware: ApiMiddleware = async (req: NextRequest, next: () => Promise<NextResponse>) => {
  // 记录开始时间
  const startTime = performance.now();
  
  // 获取请求路径
  const path = new URL(req.url).pathname;
  
  // 继续处理请求
  const response = await next();
  
  // 计算请求处理时间
  const duration = performance.now() - startTime;
  
  // 添加性能指标到响应头
  response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  
  // 如果超过阈值，记录警告日志
  const threshold = Number(process.env.API_PERFORMANCE_THRESHOLD) || 500; // 默认500ms
  if (duration > threshold) {
    console.warn(`${colors.bgYellow}${colors.black} ⚠️ 性能警告 ${colors.reset} ${req.method} ${path} 处理时间为 ${colors.yellow}${duration.toFixed(2)}ms${colors.reset}，超过了阈值 ${colors.yellow}${threshold}ms${colors.reset}`);
  }
  
  return response;
};

/**
 * 生成唯一请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 根据HTTP方法获取对应的颜色
 */
function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return colors.green;
    case 'POST':
      return colors.blue;
    case 'PUT':
    case 'PATCH':
      return colors.yellow;
    case 'DELETE':
      return colors.red;
    default:
      return colors.white;
  }
}

/**
 * 根据状态码获取图标和颜色
 */
function getStatusInfo(status: number): { icon: string; statusColor: string } {
  if (status < 300) {
    return { icon: '✅', statusColor: colors.green };
  } else if (status < 400) {
    return { icon: '🔄', statusColor: colors.cyan };
  } else if (status < 500) {
    return { icon: '⚠️', statusColor: colors.yellow };
  } else {
    return { icon: '❌', statusColor: colors.red };
  }
}

/**
 * 根据响应时间获取颜色
 */
function getDurationColor(duration: number): string {
  const threshold = Number(process.env.API_PERFORMANCE_THRESHOLD) || 500;
  
  if (duration < threshold / 2) {
    return colors.green;
  } else if (duration < threshold) {
    return colors.yellow;
  } else {
    return colors.red;
  }
} 