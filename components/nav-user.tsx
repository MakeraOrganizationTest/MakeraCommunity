'use client'

import { BadgeCheck, Bell, CreditCard, LogOut, ShieldUser } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/hooks/use-auth'
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button, Avatar } from 'antd'
import { WithPermission } from '@/hooks/use-permission'
import { P } from '@/constants/permissions'

export default function NavUser() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-[36px]! w-[36px]! animate-pulse rounded-full bg-muted" />
    )
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Button type="primary" onClick={() => router.push('/auth/login')}>
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {user?.nickname && (
          <Avatar
            size="large"
            className="h-[38px]! w-[38px]! cursor-pointer"
            src={user?.picture}
          >
            {user?.nickname.toUpperCase()}
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="end"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            {user?.nickname && (
              <Avatar src={user?.picture}>
                {user?.nickname.toUpperCase()}
              </Avatar>
            )}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user?.name}</span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <WithPermission permissionCode={P.SYSTEM.ADMIN}>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <ShieldUser />
              Admin Portal
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </WithPermission>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/auth/logout')}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
