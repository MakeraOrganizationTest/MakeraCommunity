import { supabase } from '@/lib/supabase'
import { Session } from '@/types/supabase'

/**
 * 使用邮箱和密码登录
 * @param email 邮箱地址
 * @param password 密码
 * @returns 返回 Supabase 登录结果
 */
export async function signInWithPassword(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

/**
 * 使用魔法链接登录（无需密码）
 * @param email 邮箱地址
 * @param redirectTo 重定向地址
 * @returns 返回 Supabase OTP 登录结果
 */
export async function signInWithMagicLink(email: string, redirectTo?: string) {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })
}

/**
 * 用户注册
 * @param email 邮箱地址
 * @param password 密码
 * @param redirectTo 注册成功后的重定向地址
 * @param userData 用户额外数据
 * @returns 返回 Supabase 注册结果
 */
export async function signUp(
  email: string, 
  password: string, 
  redirectTo?: string,
  userData?: Record<string, any>
) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: userData,
    },
  })
}

/**
 * 发送密码重置邮件
 * @param email 邮箱地址
 * @param redirectTo 重置密码后的重定向地址
 * @returns 返回 Supabase 重置密码结果
 */
export async function resetPasswordForEmail(email: string, redirectTo?: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
}

/**
 * 更新用户密码
 * @param password 新密码
 * @returns 返回 Supabase 更新用户结果
 */
export async function updatePassword(password: string) {
  return await supabase.auth.updateUser({
    password,
  })
}

/**
 * 获取当前会话
 * @returns 返回当前会话信息
 */
export async function getSession() {
  return await supabase.auth.getSession()
}

/**
 * 用授权码交换会话
 * @param code 授权码
 * @returns 返回交换结果
 */
export async function exchangeCodeForSession(code: string) {
  return await supabase.auth.exchangeCodeForSession(code)
}

/**
 * 登出
 * @returns 返回登出结果
 */
export async function signOut() {
  return await supabase.auth.signOut()
} 

/**
 * 监听 Auth 状态变化
 * @param callback 回调函数
 * @returns 返回监听结果
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * 获取自定义用户表中的用户数据
 * @param userId 用户ID
 * @returns 返回用户详细信息
 */
export async function getUserDetails(userId: string) {
  if (!userId) return { data: null, error: new Error('用户ID不能为空') }
  
  return await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
}

/**
 * 使用 Google 账号登录
 * @param redirectTo 重定向地址，登录成功后跳转的页面
 * @returns 返回 Supabase OAuth 登录结果
 */
export async function signInWithGoogle(redirectTo?: string) {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: redirectTo ? {
      redirectTo,
    } : undefined,
  })
}

/**
 * 使用 Apple 账号登录
 * @param redirectTo 重定向地址，登录成功后跳转的页面
 * @returns 返回 Supabase OAuth 登录结果
 */
export async function signInWithApple(redirectTo?: string) {
  return await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: redirectTo ? {
      redirectTo,
    } : undefined,
  })
}

/**
 * 使用 Facebook 账号登录
 * @param redirectTo 重定向地址，登录成功后跳转的页面
 * @returns 返回 Supabase OAuth 登录结果
 */
export async function signInWithFacebook(redirectTo?: string) {
  return await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: redirectTo ? {
      redirectTo,
    } : undefined,
  })
}

export default {
  signInWithPassword,
  signInWithMagicLink,
  signUp,
  resetPasswordForEmail,
  updatePassword,
  getSession,
  exchangeCodeForSession,
  signOut,
  onAuthStateChange,
  getUserDetails,
  signInWithGoogle,
  signInWithApple,
  signInWithFacebook,
}