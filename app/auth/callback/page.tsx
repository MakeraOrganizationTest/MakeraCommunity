"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import auth from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  
  // 处理授权回调
  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code')
      const nextPath = searchParams.get('next') || '/'
      
      if (!code) {
        setError('No authentication code received')
        setIsProcessing(false)
        return
      }
      
      try {
        // Process the code exchange
        const res = await auth.exchangeCodeForSession(code)
        console.log(222, res)

        const { error: authError } = res
        if (authError) {
          setError(`Authentication failed: ${authError.message}`)
          setIsProcessing(false)
          return
        }
        
        // Success - redirect to the next path or homepage
        router.push(nextPath)
      } catch (error: any) {
        setError(`Error processing authentication: ${error.message || 'Unknown error'}`)
        setIsProcessing(false)
      }
    }
    
    handleAuth()
  }, [router, searchParams])
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {isProcessing ? 'Processing Authentication' : 
              error ? 'Authentication Failed' : 'Authentication Successful'}
          </CardTitle>
          <CardDescription>
            {isProcessing ? 'Please wait while we verify your credentials...' : 
              error ? 'We encountered an issue signing you in' : 'You have been successfully authenticated'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Processing your sign-in...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <div className="text-center space-y-2">
                <p className="font-medium">Authentication Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground">
                  Please try signing in again or contact support if the issue persists.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-sm text-muted-foreground">Redirecting you to your destination...</p>
            </div>
          )}
          
          <Button 
            onClick={() => error ? router.push('/auth/signin') : router.push('/')} 
            className="mt-2"
            variant={error ? "default" : "outline"}
          >
            {error ? "Return to Sign In" : "Go to Homepage"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 