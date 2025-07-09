import type { Metadata } from 'next'
import '@/styles/globals.css'
// import { Inter } from 'next/font/google'
import ThemeProvider from '@/components/providers/theme-provider'
import ToasterProvider from '@/components/providers/toaster-provider'
import { Auth0Provider } from '@/components/providers/auth0-provider'
import { PermissionProvider } from '@/hooks/use-permission'
import { Toaster } from '@/components/ui/sonner'
import {
  AntdProvider,
  AntdRegistryProvider
} from '@/components/providers/antd-provider'

// const inter = Inter({
//   variable: '--font-inter',
//   subsets: ['latin'],
//   display: 'swap'
// })

export const metadata: Metadata = {
  title: 'Makera Community',
  description: 'A community platform for makers and creators'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="theme-violet" suppressHydrationWarning>
      <body className={`antialiased`}>
        <AntdRegistryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AntdProvider>
              <Auth0Provider>
                <PermissionProvider>
                  {children}
                  <Toaster />
                  <ToasterProvider />
                </PermissionProvider>
              </Auth0Provider>
            </AntdProvider>
          </ThemeProvider>
        </AntdRegistryProvider>
      </body>
    </html>
  )
}
