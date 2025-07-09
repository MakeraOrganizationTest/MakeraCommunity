'use client'

import React from 'react'
import { Layout, Avatar, Dropdown, Button, Breadcrumb } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined
} from '@ant-design/icons'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { usePermission } from '@/hooks/use-permission'
import { navigationData } from '@/components/admin/navigation-data'
import type { MenuProps } from 'antd'
import type { AdminNavigationItem } from '@/types/admin-nav'

const { Header } = Layout

interface AppHeaderProps {
  collapsed: boolean
  onToggleCollapse: () => void
  colorBgContainer: string
}

// 生成面包屑导航项
const generateBreadcrumbs = (
  pathname: string,
  navigationData: AdminNavigationItem[]
) => {
  const breadcrumbs: Array<{ title: string; href?: string }> = [
    { title: 'Home', href: '/admin' }
  ]

  for (const item of navigationData) {
    if (pathname === item.url) {
      breadcrumbs.push({ title: item.title })
      break
    }
    if (item.items) {
      for (const subItem of item.items) {
        if (pathname === subItem.url) {
          breadcrumbs.push({ title: item.title, href: item.url })
          breadcrumbs.push({ title: subItem.title })
          break
        }
      }
    }
  }

  return breadcrumbs
}

export function AppHeader({
  collapsed,
  onToggleCollapse,
  colorBgContainer
}: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { userInfo } = useAuth()
  const { hasPermission } = usePermission()

  // 过滤有权限的导航项（用于面包屑）
  const authorizedNavigationData = React.useMemo(() => {
    return navigationData
      .filter(item => {
        if (!item.code) return true
        return hasPermission(item.code)
      })
      .map(item => {
        if (item.items) {
          return {
            ...item,
            items: item.items.filter(
              subItem => !subItem.code || hasPermission(subItem.code)
            )
          }
        }
        return item
      })
  }, [navigationData, hasPermission])

  // 生成面包屑
  const breadcrumbs = generateBreadcrumbs(pathname, authorizedNavigationData)

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Front Home',
      onClick: () => router.push('/')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log out',
      onClick: () => router.push('/auth/logout')
    }
  ]

  return (
    <Header
      style={{
        padding: 0,
        background: colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64
          }}
        />

        {/* 面包屑导航 */}
        <Breadcrumb
          style={{ margin: '0 16px' }}
          items={breadcrumbs.map((crumb, index) => ({
            title: crumb.href ? (
              <a onClick={() => crumb.href && router.push(crumb.href)}>
                {crumb.title}
              </a>
            ) : (
              crumb.title
            )
          }))}
        />
      </div>

      {/* 用户信息 */}
      <div style={{ marginRight: 24 }}>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 6,
              transition: 'background-color 0.2s'
            }}
          >
            <Avatar
              size="small"
              src={userInfo?.picture}
              icon={<UserOutlined />}
              style={{ marginRight: 8 }}
            />
            <span style={{ fontSize: 14 }}>{userInfo?.nick_name}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  )
}
