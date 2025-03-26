"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

type ProtectedRouteProps = {
  children: React.ReactNode
  requireAuth?: boolean // 默认为true，如果设为false则反转逻辑（适用于已登录用户不应访问的页面）
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) return

    // 对于需要登录的页面，未登录时重定向到登录页
    if (requireAuth && !user) {
      router.push('/auth/signin')
    }
    
    // 对于已登录用户不应访问的页面（如登录注册页），重定向到首页
    if (!requireAuth && user) {
      router.push('/')
    }
  }, [user, isLoading, requireAuth, router])

  // 加载中或需要重定向时显示加载状态
  if (isLoading || (requireAuth && !user) || (!requireAuth && user)) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    )
  }

  // 满足条件时渲染子组件
  return <>{children}</>
} 