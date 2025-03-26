"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { useAuth } from "@/hooks/use-auth"
import { MagicLinkFormValues, magicLinkSchema } from "@/lib/validations/auth"
import { IconGoogle, IconFacebook, IconApple } from "@/components/icon"

export function MagicLinkForm({
  className,
  onPasswordLogin,
  ...props
}: React.ComponentProps<"div"> & { onPasswordLogin: () => void }) {
  const { signInWithGoogle, signInWithApple, signInWithFacebook } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: MagicLinkFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // Use Supabase to send magic link
      const { error } = await auth.signInWithMagicLink(data.email, `${window.location.origin}/auth/callback?next=/`)

      if (error) {
        throw error
      }

      // Submission successful, show confirmation message
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message || "Unable to send login link, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  // 社交登录处理函数
  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      setError(null)
      const redirectUrl = `${window.location.origin}/auth/callback?next=/`
      
      switch (provider) {
        case 'google':
          await signInWithGoogle(redirectUrl)
          break
        case 'apple':
          await signInWithApple(redirectUrl)
          break
        case 'facebook':
          await signInWithFacebook(redirectUrl)
          break
      }
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`)
    }
  }

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We've sent an email with a Sign in link to {form.getValues("email")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-center text-sm">
              Please check your email and click the link to sign in. If you don't see the email, check your spam folder.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false)
                form.reset()
              }}
            >
              Use another email
            </Button>
            <div className="text-center text-sm">
              Return to{" "}
              <button
                onClick={onPasswordLogin}
                className="text-primary underline underline-offset-4"
              >
                Password Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your Makera Inc account
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="m@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send magic link"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Want to use a password?{" "}
                <button
                  type="button"
                  onClick={onPasswordLogin}
                  className="text-primary underline underline-offset-4 cursor-pointer"
                >
                  Password Sign in
                </button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin('apple')}
                >
                  <IconApple className="dark:fill-white" />
                  <span className="sr-only">Sign in with Apple</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                >
                  <IconGoogle />
                  <span className="sr-only">Sign in with Google</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                >
                  <IconFacebook />
                  <span className="sr-only">Sign in with Facebook</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
} 