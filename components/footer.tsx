"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("w-full border-t bg-background", className)}>
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-3">
            <Logo size="lg" />
            <p className="text-sm text-muted-foreground">
              A sharing and exchange community platform for makers, designers and developers
            </p>
          </div>

          {/* Products */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/models" className="text-sm text-muted-foreground hover:text-foreground">
                  Model Library
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="text-sm text-muted-foreground hover:text-foreground">
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="/maker-space" className="text-sm text-muted-foreground hover:text-foreground">
                  Maker Space
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tutorials" className="text-sm text-muted-foreground hover:text-foreground">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">About</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Makera Community. All Rights Reserved
            </p>
            <div className="flex items-center space-x-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Twitter
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Facebook
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 