'use client'

import * as React from 'react'
// import { useRouter } from 'next/navigation'
// import { useState } from 'react'
// import { Menu, Search, X } from 'lucide-react'

// import { cn } from '@/lib/utils'
import { Button } from 'antd'
import ThemeModeButton from '@/components/theme-mode-button'
import NavUser from '@/components/nav-user'
import { Logo } from '@/components/logo'
import { PlusOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

export function Header() {
  const { isAuthenticated } = useAuth()
  // const router = useRouter()
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Simplified search function
  // const handleSearch = () => {
  //   router.push('/search')
  // }

  return (
    <header className="sticky top-0 z-40 w-full bg-card backdrop-blur transition-all duration-300 dark:bg-background">
      <div className="mx-auto flex h-[60px]! w-full items-center px-4 sm:px-6 md:px-12 lg:px-20 xl:px-[120px]">
        <div className="flex h-full w-full items-center justify-between">
          <div className="flex items-center gap-[60px]">
            <Logo />

            <div className="hidden gap-9 md:flex">
              <Link
                className="text-sm font-semibold text-text-primary!"
                href="/"
              >
                Model
              </Link>
              <Link
                className="text-sm font-semibold text-text-primary!"
                href="/"
              >
                Community
              </Link>
              <Link
                className="text-sm font-semibold text-text-primary!"
                href="/"
              >
                Forums
              </Link>
              <Link
                className="text-sm font-semibold text-text-primary!"
                href="/"
              >
                Purchasing
              </Link>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle button */}
            <ThemeModeButton />

            {isAuthenticated && (
              <Button
                type="primary"
                className="rounded-[12px]! px-6!"
                icon={<PlusOutlined />}
              >
                Upload
              </Button>
            )}

            {/* User actions */}
            <div className="hidden items-center space-x-2 sm:flex">
              <NavUser />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
