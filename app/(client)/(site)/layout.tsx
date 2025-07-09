import React from 'react'

import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { App } from 'antd'

export default function MainLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <App>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </App>
  )
}
