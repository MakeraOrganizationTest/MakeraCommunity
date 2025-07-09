import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { NextResponse } from 'next/server'
import { syncUser } from '@/api/client/user'

export const auth0 = new Auth0Client({
  async onCallback(error, context, session) {
    if (error) {
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL}/login?error=${error.message}`
      )
    }
    // 用户登录成功，session.user 可用
    if (session?.user) {
      console.log('Auth0 user login:', session.user)
      try {
        await syncUser(
          {
            auth0_id: session.user.sub,
            full_name: session.user.name,
            nick_name: session.user.nickname,
            email: session.user.email,
            picture: session.user.picture,
            email_verified: session.user.email_verified
          },
          {
            showErrorToast: false // 服务端环境禁用toast提示
          }
        )
        console.log('User synchronized successfully')
      } catch (error) {
        console.error('Failed to sync user:', error)
        // 不阻断登录流程，只记录错误
      }
    }
    // 正常跳转回 returnTo 地址
    const returnUrl = context.returnTo || '/'
    const absoluteUrl = returnUrl.startsWith('http')
      ? returnUrl
      : `${process.env.APP_BASE_URL}${returnUrl}`
    return NextResponse.redirect(absoluteUrl)
  }
})
