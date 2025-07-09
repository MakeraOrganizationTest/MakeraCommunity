'use client'

import React from 'react'
import { Layout, Menu } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { usePermission } from '@/hooks/use-permission'
import { navigationData } from '@/components/admin/navigation-data'
import { SiMakerbot } from 'react-icons/si'
import type { MenuProps } from 'antd'

const { Sider } = Layout

interface AppSidebarProps {
  collapsed: boolean
  onMenuClick?: (key: string) => void
}

// 转换导航数据为 Ant Design Menu 格式
const convertToMenuItems = (items: any[]): MenuProps['items'] => {
  return items.map(item => {
    if (item.items && item.items.length > 0) {
      return {
        key: item.code,
        icon: item.icon,
        label: item.title,
        children: item.items.map((subItem: any) => ({
          key: subItem.code,
          label: subItem.title
        }))
      }
    }

    return {
      key: item.code,
      icon: item.icon,
      label: item.title
    }
  })
}

export function AppSidebar({ collapsed, onMenuClick }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { hasPermission } = usePermission()

  // 过滤有权限的导航项
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

  // 转换菜单项
  const menuItems = convertToMenuItems(authorizedNavigationData)

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    for (const item of authorizedNavigationData) {
      if (pathname === item.url) {
        return [item.code]
      }
      if (item.items) {
        for (const subItem of item.items) {
          if (pathname === subItem.url) {
            return [subItem.code]
          }
        }
      }
    }
    return []
  }

  // 获取当前展开的菜单项
  const getOpenKeys = () => {
    for (const item of authorizedNavigationData) {
      if (item.items) {
        for (const subItem of item.items) {
          if (pathname === subItem.url) {
            return [item.code]
          }
        }
      }
    }
    return []
  }

  // 菜单点击处理
  const handleMenuClick = ({ key }: { key: string }) => {
    const findUrlByCode = (code: string): string | null => {
      for (const item of authorizedNavigationData) {
        if (item.code === code) {
          return item.url
        }
        if (item.items) {
          for (const subItem of item.items) {
            if (subItem.code === code) {
              return subItem.url
            }
          }
        }
      }
      return null
    }

    const url = findUrlByCode(key)
    if (url && url !== '#') {
      router.push(url)
    }

    // 调用外部传入的回调
    onMenuClick?.(key)
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      collapsedWidth={50}
      theme="dark"
      width={220}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          margin: collapsed ? '0 13px' : '0 20px',
          display: 'flex',
          alignItems: 'center',
          color: 'white',
          fontSize: collapsed ? 0 : 16,
          fontWeight: 'bold',
          overflow: 'hidden',
          transition: 'all 0.2s'
        }}
      >
        <SiMakerbot style={{ fontSize: 24, marginRight: collapsed ? 0 : 8 }} />
        {!collapsed && 'Makera Admin'}
      </div>

      {/* 菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}
