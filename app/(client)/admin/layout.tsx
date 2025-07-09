'use client'

import React, { useState } from 'react'
import { Layout, theme } from 'antd'
import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { AppHeader } from '@/components/admin/app-header'

const { Content } = Layout

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <AppSidebar collapsed={collapsed} />

      <Layout
        style={{ marginLeft: collapsed ? 50 : 220, transition: 'all 0.2s' }}
      >
        {/* 顶部导航 */}
        <AppHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          colorBgContainer={colorBgContainer}
        />

        {/* 内容区域 */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
