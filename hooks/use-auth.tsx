"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, User } from '@/types/supabase'
import auth from '@/actions/auth'

// 用户自定义表数据类型
type UserInfo = {
  id: string
  full_name: string | null
  user_name: string | null
  avatar_url: string | null
  bio: string | null
  gender: string | null
  birthday: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  userInfo: UserInfo | null
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signInWithApple: (redirectTo?: string) => Promise<void>
  signInWithFacebook: (redirectTo?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 获取自定义用户数据
  const fetchUserInfo = async (userId: string) => {
    try {
      const { data, error } = await auth.getUserDetails(userId)
      if (error) {
        console.error('Error fetching user info:', error)
        return
      }
      setUserInfo(data)
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  // 加载用户会话
  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      // 如果有用户，获取自定义用户数据
      if (session?.user?.id) {
        await fetchUserInfo(session.user.id)
      } else {
        setUserInfo(null)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 退出登录
  const signOut = async () => {
    await auth.signOut()
    setSession(null)
    setUser(null)
    setUserInfo(null)
    router.push('/auth/signin')
    router.refresh()
  }

  // 使用 Google 登录
  const signInWithGoogle = async (redirectTo?: string) => {
    const redirectUrl = redirectTo || `${window.location.origin}/auth/callback`
    await auth.signInWithGoogle(redirectUrl)
  }

  // 使用 Apple 登录
  const signInWithApple = async (redirectTo?: string) => {
    const redirectUrl = redirectTo || `${window.location.origin}/auth/callback`
    await auth.signInWithApple(redirectUrl)
  }

  // 使用 Facebook 登录
  const signInWithFacebook = async (redirectTo?: string) => {
    const redirectUrl = redirectTo || `${window.location.origin}/auth/callback`
    await auth.signInWithFacebook(redirectUrl)
  }

  // 监听认证状态变化
  useEffect(() => {
    refreshSession()

    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // 如果有用户，获取自定义用户数据
      if (session?.user?.id) {
        await fetchUserInfo(session.user.id)
      } else {
        setUserInfo(null)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user,
    userInfo,
    isLoading,
    signOut,
    refreshSession,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 自定义钩子，便于使用认证上下文
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 