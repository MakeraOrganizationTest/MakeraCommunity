// 在 constants/permissions.ts 创建
export const P = {
  // 系统权限
  SYSTEM: {
    ADMIN: 'ADMIN'
  },

  // 模块权限
  MODULE: {
    USERS: 'USERS',
    MODELS: 'MODELS',
    COMPETITIONS: 'COMPETITIONS',
    SETTINGS: 'SETTINGS'
  },

  // 页面权限
  PAGE: {
    DASHBOARD: 'DASHBOARD',
    PERMISSION: 'PERMISSION',
    ROLE: 'ROLE',
    USER: 'USER'
  },

  // 操作权限
  OPERATION: {
    PERMISSION: {
      VIEW: 'PERMISSION:VIEW',
      ADD: 'PERMISSION:ADD',
      EDIT: 'PERMISSION:EDIT',
      DELETE: 'PERMISSION:DELETE'
    },
    ROLE: {
      VIEW: 'ROLE:VIEW',
      ADD: 'ROLE:ADD',
      EDIT: 'ROLE:EDIT',
      DELETE: 'ROLE:DELETE'
    },
    USER: {
      VIEW: 'USER:VIEW',
      ADD: 'USER:ADD',
      EDIT: 'USER:EDIT',
      DELETE: 'USER:DELETE'
    }
  }
}
