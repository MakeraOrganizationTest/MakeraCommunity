
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/check-email', '/auth/callback']
const protectedRoutes = ['/dashboard', '/profile', '/settings']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 创建 Supabase 服务端客户端
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 检查用户会话状态
  const { data: { session } } = await supabase.auth.getSession()
  const url = request.nextUrl.pathname

  // 已登录用户访问认证页面，重定向到首页
  if (session && authRoutes.some(route => url.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 未登录用户访问受保护页面，重定向到登录页
  if (!session && protectedRoutes.some(route => url.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有需要路由保护的路径
     * - /auth/signin, /auth/signup, /auth/callback 登录注册相关路径
     * - /dashboard, /profile 需要登录才能访问的路径
     */
    '/auth/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
} 