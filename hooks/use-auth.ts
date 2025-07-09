import { useUser, getAccessToken } from '@auth0/nextjs-auth0'
import { useState, useEffect } from 'react'
import { User } from '@/types/user'
import { getUserInfo } from '@/api/client/user'

export function useAuth() {
  const { user: auth0User, isLoading: auth0Loading } = useUser()
  const [userInfo, setUserInfo] = useState<User | null>(null)
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false)
  const [userInfoError, setUserInfoError] = useState<string | null>(null)

  // 判断用户是否登录 - 返回状态值而不是函数
  const isAuthenticated = !!auth0User

  // 当 Auth0 用户信息可用时，获取本地用户详情
  useEffect(() => {
    let isMounted = true

    const fetchUserInfo = async () => {
      if (!auth0User?.sub) return

      setIsLoadingUserInfo(true)
      setUserInfoError(null)

      try {
        const response = await getUserInfo({ auth0_id: auth0User.sub })

        if (isMounted) {
          if (response.success && response.data) {
            setUserInfo(response.data)
          } else {
            setUserInfoError(response.message || '获取用户信息失败')
          }
        }
      } catch (error) {
        if (isMounted) {
          setUserInfoError(
            error instanceof Error ? error.message : '获取用户信息失败'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingUserInfo(false)
        }
      }
    }

    if (isAuthenticated && !userInfo) {
      fetchUserInfo()
    } else if (!isAuthenticated) {
      // 用户登出时清空本地用户信息
      setUserInfo(null)
      setUserInfoError(null)
    }

    return () => {
      isMounted = false
    }
  }, [auth0User?.sub, isAuthenticated, userInfo])

  // 手动刷新用户信息的方法
  const refreshUserInfo = async () => {
    if (!auth0User?.sub) return

    setIsLoadingUserInfo(true)
    setUserInfoError(null)

    try {
      const response = await getUserInfo({ auth0_id: auth0User.sub })

      if (response.success && response.data) {
        setUserInfo(response.data)
      } else {
        setUserInfoError(
          response.message || 'Failed to obtain user information'
        )
      }
    } catch (error) {
      setUserInfoError(
        error instanceof Error
          ? error.message
          : 'Failed to obtain user information'
      )
    } finally {
      setIsLoadingUserInfo(false)
    }
  }

  return {
    // 基础认证信息
    isAuthenticated,
    user: auth0User, // Auth0 用户信息
    isLoading: auth0Loading, // Auth0 加载状态

    // 本地用户详情
    userInfo, // 本地数据库用户详情
    isLoadingUserInfo, // 用户详情加载状态
    userInfoError, // 用户详情错误信息

    // 工具方法
    getAccessToken, // 获取访问令牌
    refreshUserInfo // 手动刷新用户信息
  }
}
