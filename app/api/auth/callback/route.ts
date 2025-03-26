import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import auth from '@/actions/auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    await auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  const redirectTo = requestUrl.searchParams.get('next') || '/'
  
  return NextResponse.redirect(new URL(redirectTo, request.url))
} 