import {
  TrophyOutlined,
  HomeOutlined,
  SettingOutlined,
  AppstoreOutlined,
  TeamOutlined
} from '@ant-design/icons'
import type { AdminNavigationItem } from '@/types/admin-nav'

// 导航数据
export const navigationData: AdminNavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: <HomeOutlined />,
    code: 'DASHBOARD'
  },
  {
    title: 'Accounts',
    url: '/admin/accounts',
    code: 'ACCOUNTS',
    icon: <TeamOutlined />,
    items: [
      {
        title: 'Roles',
        url: '/admin/roles',
        code: 'ROLES'
      },
      {
        title: 'Permissions',
        url: '/admin/permissions',
        code: 'PERMISSIONS'
      },
      {
        title: 'Users',
        url: '/admin/users',
        code: 'USERS'
      }
    ]
  },
  {
    title: 'Models',
    url: '/admin/models',
    icon: <AppstoreOutlined />,
    code: 'MODELS',
    items: [
      {
        title: 'Categories',
        url: '/admin/categories',
        code: 'CATEGORIES'
      },
      {
        title: 'Licenses',
        url: '/admin/licenses',
        code: 'LICENSES'
      }
    ]
  },
  {
    title: 'Competitions',
    url: '/admin/competitions',
    icon: <TrophyOutlined />,
    code: 'COMPETITIONS',
    items: [
      {
        title: 'Introduction',
        url: '/admin/competitions/introduction',
        code: 'COMPETITIONS_INTRODUCTION'
      }
    ]
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: <SettingOutlined />,
    code: 'SETTINGS',
    items: [
      {
        title: 'System settings',
        url: '/admin/settings/system',
        code: 'SETTINGS_SYSTEM'
      }
    ]
  }
]
