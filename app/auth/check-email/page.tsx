"use client"

import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CheckEmailPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Makera Inc.
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Check your email ✉️</CardTitle>
            <CardDescription>
              We've sent a confirmation email to your address. Please check your inbox and click the link to complete registration.
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
    </div>
  )
} 