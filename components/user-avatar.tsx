"use client"

import { User as UserIcon, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function UserAvatar() {
  const router = useRouter()
  const { user, userInfo, signOut, isLoading } = useAuth()

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/auth/signin")}
        >
          Sign in
        </Button>
      </div>
    )
  }

  // 优先使用自定义用户表数据
  console.log('user', userInfo, user)
  const userInitial = userInfo?.user_name?.[0] || userInfo?.full_name?.[0] || user.email?.[0] || "U"
  const userName = '@' + userInfo?.user_name
  const userEmail = user.email || ""
  const userNickname = userInfo?.full_name || `用户${userInfo?.user_name?.split('_')[1]}`
  const avatarUrl = userInfo?.avatar_url || ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={userName || "用户头像"} />
          ) : (
            <AvatarFallback>{userInitial.toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center p-2">
          <Avatar className="h-10 w-10 mr-2">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={userName || "用户头像"} />
            ) : (
              <AvatarFallback>{userInitial.toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col space-y-1 overflow-hidden">
            <p className="text-sm font-medium leading-none">{userNickname}</p>
            <p className="text-xs text-muted-foreground truncate">{userName}</p>
            {/* <p className="text-xs text-muted-foreground truncate">{userEmail}</p> */}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>我的账户</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <UserIcon className="mr-2 h-4 w-4" />
          账号设置
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 