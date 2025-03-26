import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import auth from "@/actions/auth"
import { ResetPasswordFormValues, resetPasswordSchema } from "@/lib/validations/auth"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Check if URL contains a reset password token
  useEffect(() => {
    const checkTokenParams = async () => {
      if (typeof window !== 'undefined') {
        try {
          // 检查URL查询参数和hash参数
          const queryParams = new URLSearchParams(window.location.search)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          
          // 检查URL查询参数或hash参数中是否包含recovery类型
          if (queryParams.get("type") === "recovery" || hashParams.get("type") === "recovery") {
            setHasToken(true)
            return
          }
          
          // 获取当前会话状态
          const { data } = await auth.getSession()
          
          // 如果有会话且处于恢复模式，则允许密码重置
          if (data.session) {
            setHasToken(true)
          } else {
            // 检查是否有code参数，这可能是Supabase重定向回来的情况
            const code = queryParams.get("code") || hashParams.get("code")
            if (code) {
              // 尝试处理密码重置链接
              const { error } = await auth.exchangeCodeForSession(code)
              if (!error) {
                setHasToken(true)
                return
              }
            }
            
            // 如果没有有效的重置令牌，重定向到忘记密码页面
            router.push("/auth/forgot-password")
          }
        } catch (error) {
          console.error("Error checking reset token:", error)
          // 出错时重定向到忘记密码页面
          router.push("/auth/forgot-password")
        }
      }
    }

    checkTokenParams()
  }, [router])

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // Update password with Supabase
      const { error } = await auth.updatePassword(data.password)

      if (error) {
        throw error
      }

      // Password reset successful
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || "Password reset failed, please try again")
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Password Reset Complete</CardTitle>
            <CardDescription>
              Your password has been successfully reset. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">✅</div>
              <p className="mb-2">Password reset successful!</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full" 
              onClick={() => router.push("/auth/signin")}
            >
              Go to sign in
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!hasToken) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Invalid Link ⚠️</CardTitle>
            <CardDescription>
              This link is invalid or has expired. Please try requesting a new password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="mb-2">Unable to verify password reset request</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full" 
              onClick={() => router.push("/auth/forgot-password")}
            >
              Request new reset link
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full grid gap-6">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 