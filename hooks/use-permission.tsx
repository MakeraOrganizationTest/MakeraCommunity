'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './use-auth'
import { getUserPermissions } from '@/api/client/user'
import { Permission } from '@/types/permission'
import React from 'react'

export type PermissionCode = string

export interface PermissionResult {
  // 当前用户的所有权限
  permissions: Permission[]
  // 当前用户的权限码列表
  permissionCodes: PermissionCode[]
  // 权限加载状态
  isLoading: boolean
  // 权限是否已加载
  isReady: boolean
  // 判断用户是否拥有指定权限
  hasPermission: (code: PermissionCode) => boolean
  // 判断用户是否拥有多个权限中的任意一个
  hasAnyPermission: (codes: PermissionCode[]) => boolean
  // 判断用户是否拥有所有指定权限
  hasAllPermissions: (codes: PermissionCode[]) => boolean
  // 根据权限条件渲染内容
  renderWithPermission: <T>(code: PermissionCode, component: T) => T | null
  // 刷新权限数据
  refreshPermissions: () => Promise<void>
}

// 创建一个权限上下文，用于缓存权限数据
const PermissionContext = React.createContext<PermissionResult | null>(null)

export function usePermission(): PermissionResult {
  const permissionContext = React.useContext(PermissionContext)

  // 如果已经在上下文中有权限数据，直接返回
  if (permissionContext) {
    return permissionContext
  }

  const { user, isAuthenticated, userInfo, isLoadingUserInfo } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionCodes, setPermissionCodes] = useState<PermissionCode[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isReady, setIsReady] = useState<boolean>(false)

  // 获取用户权限
  const fetchUserPermissions = useCallback(async () => {
    // 如果用户未认证，清空权限数据
    if (!user || !isAuthenticated) {
      setPermissions([])
      setPermissionCodes([])
      setIsLoading(false)
      setIsReady(true)
      return
    }

    // 如果用户详情还在加载中，保持等待状态
    if (isLoadingUserInfo) {
      setIsLoading(true)
      setIsReady(false)
      return
    }

    // 如果用户详情加载完成但没有用户ID，说明用户数据同步可能出现问题
    if (!userInfo?.id) {
      setPermissions([])
      setPermissionCodes([])
      setIsLoading(false)
      setIsReady(true)
      return
    }

    setIsLoading(true)
    try {
      const res = await getUserPermissions(userInfo.id)
      if (res.success) {
        const fetchedPermissions = res.data || []
        setPermissions(fetchedPermissions)

        // 提取权限码
        const codes = fetchedPermissions
          .filter((p: Permission) => p.code)
          .map((p: Permission) => p.code as string)
        setPermissionCodes(codes)
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error)
    } finally {
      setIsLoading(false)
      setIsReady(true)
    }
  }, [user, isAuthenticated, userInfo?.id, isLoadingUserInfo])

  // 初始加载权限 - 需要等待用户详情加载完成
  useEffect(() => {
    fetchUserPermissions()
  }, [fetchUserPermissions])

  // 检查单个权限
  const hasPermission = useCallback(
    (code: PermissionCode): boolean => {
      if (!isReady || !isAuthenticated) return false
      return permissionCodes.includes(code)
    },
    [isReady, isAuthenticated, permissionCodes]
  )

  // 检查是否拥有多个权限中的任意一个
  const hasAnyPermission = useCallback(
    (codes: PermissionCode[]): boolean => {
      if (!isReady || !isAuthenticated) return false
      return codes.some(code => permissionCodes.includes(code))
    },
    [isReady, isAuthenticated, permissionCodes]
  )

  // 检查是否拥有所有指定权限
  const hasAllPermissions = useCallback(
    (codes: PermissionCode[]): boolean => {
      if (!isReady || !isAuthenticated) return false
      return codes.every(code => permissionCodes.includes(code))
    },
    [isReady, isAuthenticated, permissionCodes]
  )

  // 根据权限条件渲染内容
  const renderWithPermission = useCallback(
    <T,>(code: PermissionCode, component: T): T | null => {
      return hasPermission(code) ? component : null
    },
    [hasPermission]
  )

  // 刷新权限
  const refreshPermissions = useCallback(async () => {
    await fetchUserPermissions()
  }, [fetchUserPermissions])

  return {
    permissions,
    permissionCodes,
    isLoading,
    isReady,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    renderWithPermission,
    refreshPermissions
  }
}

// 创建权限提供者组件
export function PermissionProvider({
  children
}: {
  children: React.ReactNode
}) {
  const permissionResult = usePermission()

  return (
    <PermissionContext.Provider value={permissionResult}>
      {children}
    </PermissionContext.Provider>
  )
}

// 创建一个权限组件包装器，用于基于权限条件渲染组件
export const WithPermission = React.memo(function WithPermissionComponent({
  permissionCode,
  fallback = null,
  children
}: {
  permissionCode: PermissionCode
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const { hasPermission, permissionCodes, isReady } = usePermission()

  // 使用useMemo缓存权限检查结果
  const hasPermissionResult = useMemo(() => {
    return hasPermission(permissionCode)
  }, [hasPermission, permissionCode, permissionCodes, isReady])

  return hasPermissionResult ? children : fallback
})

// 创建一个权限组件包装器，用于检查多个权限中的任意一个
export const WithAnyPermission = React.memo(
  function WithAnyPermissionComponent({
    permissionCodes: codes,
    fallback = null,
    children
  }: {
    permissionCodes: PermissionCode[]
    fallback?: React.ReactNode
    children: React.ReactNode
  }) {
    const { hasAnyPermission, permissionCodes, isReady } = usePermission()

    // 使用useMemo缓存权限检查结果
    const hasAnyPermissionResult = useMemo(() => {
      return hasAnyPermission(codes)
    }, [hasAnyPermission, codes, permissionCodes, isReady])

    return hasAnyPermissionResult ? children : fallback
  }
)

// 创建一个权限组件包装器，用于检查是否拥有所有指定权限
export const WithAllPermissions = React.memo(
  function WithAllPermissionsComponent({
    permissionCodes: codes,
    fallback = null,
    children
  }: {
    permissionCodes: PermissionCode[]
    fallback?: React.ReactNode
    children: React.ReactNode
  }) {
    const { hasAllPermissions, permissionCodes, isReady } = usePermission()

    // 使用useMemo缓存权限检查结果
    const hasAllPermissionsResult = useMemo(() => {
      return hasAllPermissions(codes)
    }, [hasAllPermissions, codes, permissionCodes, isReady])

    return hasAllPermissionsResult ? children : fallback
  }
)
