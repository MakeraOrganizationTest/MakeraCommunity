import { Session, User, Provider, AuthError, AuthResponse, AuthTokenResponse, UserResponse, VerifyOtpParams } from '@supabase/supabase-js'

// 用户相关类型
export type { Session, User, Provider, AuthError, AuthResponse, AuthTokenResponse, UserResponse, VerifyOtpParams }

// 自定义用户类型
export interface UserDetails {
  id: string
  email?: string
  avatar_url?: string
  full_name?: string
  role?: string
  created_at?: string
}

// 认证上下文类型
export interface AuthContextType {
  user: User | null
  userDetails: UserDetails | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, redirectTo?: string, userData?: Record<string, any>) => Promise<AuthResponse>
  signOut: () => Promise<void>
}