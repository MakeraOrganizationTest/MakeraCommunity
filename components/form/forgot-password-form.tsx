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
import { ForgotPasswordFormValues, forgotPasswordSchema } from "@/lib/validations/auth"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // Send password reset email with Supabase
      const { error } = await auth.resetPasswordForEmail(
        data.email, 
        `${window.location.origin}/auth/reset-password`
      )

      if (error) {
        throw error
      }

      // Success
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email, please try again")
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We've sent a password reset link to your email. Please check your inbox and click the link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">✉️</div>
              <p className="mb-2">The email might take a few minutes to arrive</p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, please check your spam folder
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/signin">Return to sign in</Link>
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
          <CardTitle className="text-xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a password reset link
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
                          placeholder="name@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
              <div className="text-center text-sm">
                <Link
                  href="/auth/signin"
                  className="underline underline-offset-4"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 