"use client"

import { useState } from "react"
import { GalleryVerticalEnd } from "lucide-react"

import { SignInForm } from "@/components/form/sign-in-form"
import { MagicLinkForm } from "@/components/form/magic-link-form"
import ProtectedRoute from "@/components/protected-route"

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<"magic-link" | "password">("magic-link")

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Makera Inc.
          </a>
          
          {loginMethod === "magic-link" ? (
            <MagicLinkForm onPasswordLogin={() => setLoginMethod("password")} />
          ) : (
            <SignInForm onMagicLinkLogin={() => setLoginMethod("magic-link")} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
