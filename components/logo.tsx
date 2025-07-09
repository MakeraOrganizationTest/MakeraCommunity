'use client'

import Link from 'next/link'
// import { Dela_Gothic_One } from 'next/font/google'

// const delaGothicOne = Dela_Gothic_One({
//   subsets: ['latin'],
//   weight: ['400']
// })

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center space-x-2 text-[18px] font-bold text-text-primary! ${className}`}
    >
      MKERA
    </Link>
  )
}
