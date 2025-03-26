"use client";

import Link from "next/link";
import { SiMakerbot } from "react-icons/si";
import { useTheme } from "next-themes";
import { LineShadowText } from "@/components/magicui/line-shadow-text";
import { useState, useEffect } from "react";

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
  bold?: boolean
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // 在组件挂载后执行以避免水合错误
  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const textSizeClasses = {
    sm: "text-md",
    md: "text-xl",
    lg: "text-2xl",
  }

  // 只在客户端渲染后决定阴影颜色
  const shadowColor = mounted && (resolvedTheme === "dark" || theme === "dark") 
    ? "rgba(255,255,255,0.7)" 
    : "rgba(0,0,0,0.7)";

  return (
    <Link href="/" className={`flex items-center space-x-2 font-bold ${className}`}>
      <SiMakerbot 
        className={`${sizeClasses[size]}`} 
        style={{ 
          strokeWidth: '0.5px',
          stroke: 'currentColor',
          fill: 'currentColor',
        }} 
      />
      {showText && 
        <LineShadowText className={`${textSizeClasses[size]} tracking-wider`} shadowColor={shadowColor}>
          Makera
        </LineShadowText>
      }
    </Link>
  )
} 