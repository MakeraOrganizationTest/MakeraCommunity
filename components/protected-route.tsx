'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/use-permission'
import { useAuth } from '@/hooks/use-auth'

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false
}: {
  children: React.ReactNode
  requiredPermission?: string
  requiredPermissions?: string[]
  requireAll?: boolean
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions, isReady } =
    usePermission()

  useEffect(() => {
    // 等待认证和权限加载完成
    if (authLoading || !isReady) return

    // 未登录用户重定向到登录页
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    // 权限验证
    let hasAccess = true

    if (requiredPermission) {
      hasAccess = hasPermission(requiredPermission)
    } else if (requiredPermissions) {
      hasAccess = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions)
    }

    // 无权限重定向到403页面
    if (!hasAccess) {
      router.push('/403')
    }
  }, [
    authLoading,
    isAuthenticated,
    isReady,
    requiredPermission,
    requiredPermissions,
    requireAll,
    router,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  ])

  // 显示加载状态
  if (authLoading || !isReady) {
    return <div>Loading...</div>
  }

  // 返回子组件
  return <>{children}</>
}
