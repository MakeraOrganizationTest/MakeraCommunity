import { PrismaClient, PermissionType } from '@/generated/prisma'

interface PermissionData {
  id: number
  name: string
  code: string
  parent_id: number | null
  type: PermissionType
  description: string | null
}

// 权限数据
const permissionsData: PermissionData[] = [
  {
    id: 1,
    name: 'Admin',
    code: 'ADMIN',
    parent_id: null,
    type: 'system' as PermissionType,
    description: '后台管理系统'
  },
  {
    id: 2,
    name: 'Dashboard',
    code: 'DASHBOARD',
    parent_id: 1,
    type: 'page' as PermissionType,
    description: '仪表盘页面'
  },
  {
    id: 3,
    name: 'Accounts',
    code: 'ACCOUNTS',
    parent_id: 1,
    type: 'module' as PermissionType,
    description: '账户管理模块'
  },
  {
    id: 4,
    name: 'Permissions',
    code: 'PERMISSIONS',
    parent_id: 3,
    type: 'page' as PermissionType,
    description: '权限管理页面'
  },
  {
    id: 5,
    name: 'Roles',
    code: 'ROLES',
    parent_id: 3,
    type: 'page' as PermissionType,
    description: '角色管理页面'
  },
  {
    id: 6,
    name: 'Users',
    code: 'USERS',
    parent_id: 3,
    type: 'page' as PermissionType,
    description: '用户管理页面'
  },
  {
    id: 7,
    name: 'Models',
    code: 'MODELS',
    parent_id: 1,
    type: 'module' as PermissionType,
    description: '模型管理模块'
  },
  {
    id: 8,
    name: 'Competitions',
    code: 'COMPETITIONS',
    parent_id: 1,
    type: 'module' as PermissionType,
    description: '活动/竞赛管理模块'
  },
  {
    id: 9,
    name: 'Settings',
    code: 'SETTINGS',
    parent_id: 1,
    type: 'module' as PermissionType,
    description: '系统设置模块'
  },
  {
    id: 11,
    name: 'Permissions:Add',
    code: 'PERMISSIONS:ADD',
    parent_id: 4,
    type: 'operation' as PermissionType,
    description: '权限管理:新增'
  },
  {
    id: 12,
    name: 'Permissions:Delete',
    code: 'PERMISSIONS:DELETE',
    parent_id: 4,
    type: 'operation' as PermissionType,
    description: '权限管理:删除'
  },
  {
    id: 13,
    name: 'Permissions:Edit',
    code: 'PERMISSIONS:EDIT',
    parent_id: 4,
    type: 'operation' as PermissionType,
    description: '权限管理:编辑'
  },
  {
    id: 14,
    name: 'Permissions:View',
    code: 'PERMISSIONS:VIEW',
    parent_id: 4,
    type: 'operation' as PermissionType,
    description: '权限管理:查看'
  },
  {
    id: 15,
    name: 'Roles:Add',
    code: 'ROLES:ADD',
    parent_id: 5,
    type: 'operation' as PermissionType,
    description: '角色管理:新增'
  },
  {
    id: 16,
    name: 'Roles:Delete',
    code: 'ROLES:DELETE',
    parent_id: 5,
    type: 'operation' as PermissionType,
    description: '角色管理:删除'
  },
  {
    id: 17,
    name: 'Roles:Edit',
    code: 'ROLES:EDIT',
    parent_id: 5,
    type: 'operation' as PermissionType,
    description: '角色管理:编辑'
  },
  {
    id: 18,
    name: 'Roles:View',
    code: 'ROLES:VIEW',
    parent_id: 5,
    type: 'operation' as PermissionType,
    description: '角色管理:查看'
  },
  {
    id: 19,
    name: 'Users:Edit',
    code: 'USERS:EDIT',
    parent_id: 6,
    type: 'operation' as PermissionType,
    description: '用户管理:编辑'
  },
  {
    id: 20,
    name: 'Users:View',
    code: 'USERS:VIEW',
    parent_id: 6,
    type: 'operation' as PermissionType,
    description: '用户管理:查看'
  },
  {
    id: 21,
    name: 'Users:Delete',
    code: 'USERS:DELETE',
    parent_id: 6,
    type: 'operation' as PermissionType,
    description: '用户管理:删除'
  },
  {
    id: 22,
    name: 'Users:Add',
    code: 'USERS:ADD',
    parent_id: 6,
    type: 'operation' as PermissionType,
    description: '用户管理:新增'
  },
  {
    id: 10,
    name: 'Categories',
    code: 'CATEGORIES',
    parent_id: 7,
    type: 'page' as PermissionType,
    description: '模型分类管理页面'
  },
  {
    id: 23,
    name: 'Categories:Add',
    code: 'CATEGORIES:ADD',
    parent_id: 10,
    type: 'operation' as PermissionType,
    description: '模型分类管理:新增'
  },
  {
    id: 24,
    name: 'Categories:Delete',
    code: 'CATEGORIES:DELETE',
    parent_id: 10,
    type: 'operation' as PermissionType,
    description: '模型分类管理:删除'
  },
  {
    id: 25,
    name: 'Categories:Edit',
    code: 'CATEGORIES:EDIT',
    parent_id: 10,
    type: 'operation' as PermissionType,
    description: '模型分类管理:编辑'
  },
  {
    id: 26,
    name: 'Categories:View',
    code: 'CATEGORIES:VIEW',
    parent_id: 10,
    type: 'operation' as PermissionType,
    description: '模型分类管理:查看'
  },
  {
    id: 27,
    name: 'Licenses',
    code: 'LICENSES',
    parent_id: 7,
    type: 'page' as PermissionType,
    description: '许可证管理页面'
  },
  {
    id: 28,
    name: 'Licenses:Add',
    code: 'LICENSES:ADD',
    parent_id: 27,
    type: 'operation' as PermissionType,
    description: '许可证管理:新增'
  },
  {
    id: 29,
    name: 'Licenses:Delete',
    code: 'LICENSES:DELETE',
    parent_id: 27,
    type: 'operation' as PermissionType,
    description: '许可证管理:删除'
  },
  {
    id: 30,
    name: 'Licenses:View',
    code: 'LICENSES:VIEW',
    parent_id: 27,
    type: 'operation' as PermissionType,
    description: '许可证管理:查看'
  },
  {
    id: 31,
    name: 'Licenses:Edit',
    code: 'LICENSES:EDIT',
    parent_id: 27,
    type: 'operation' as PermissionType,
    description: '许可证管理:编辑'
  }
]

export async function seedPermissions(prisma: PrismaClient) {
  console.log('开始初始化权限数据...')

  // 按层级插入权限数据
  const totalPermissions = await insertPermissionsByLevel(
    prisma,
    permissionsData
  )
  console.log(`🎉 已创建/更新 ${totalPermissions} 个系统权限`)

  return permissionsData
}

// 按层级插入权限的函数
async function insertPermissionsByLevel(
  prisma: PrismaClient,
  permissions: PermissionData[],
  maxDepth = 10
): Promise<number> {
  // 权限映射表，用于快速查找
  const permissionMap = new Map<number, PermissionData>()
  permissions.forEach(p => permissionMap.set(p.id, p))

  // 层级映射，存储每个层级的权限
  const levelMap = new Map<number, PermissionData[]>()

  // 首先找出根权限（无父级）
  const rootPermissions = permissions.filter(p => p.parent_id === null)
  levelMap.set(0, rootPermissions)

  // 总共插入的权限数量
  let totalInserted = 0

  // 处理每个层级
  for (let level = 0; level < maxDepth; level++) {
    const currentLevelPermissions = levelMap.get(level)

    // 如果当前层级没有权限，则结束递归
    if (!currentLevelPermissions || currentLevelPermissions.length === 0) {
      break
    }

    console.log(
      `插入第${level + 1}层权限，共 ${currentLevelPermissions.length} 条...`
    )

    // 使用 Promise.all 并行插入当前层级的所有权限
    const results = await Promise.all(
      currentLevelPermissions.map(permission =>
        prisma.permissions
          .upsert({
            where: { id: permission.id },
            update: {
              name: permission.name,
              code: permission.code,
              parent_id: permission.parent_id,
              type: permission.type,
              description: permission.description,
              updated_at: new Date()
            },
            create: {
              id: permission.id,
              name: permission.name,
              code: permission.code,
              parent_id: permission.parent_id,
              type: permission.type,
              description: permission.description
            }
          })
          .catch(error => {
            console.error(
              `处理权限 ${permission.name}(ID: ${permission.id}) 失败:`,
              error
            )
            return null
          })
      )
    )

    const successCount = results.filter(r => r !== null).length
    console.log(
      `🎉 成功插入第${level + 1}层权限 ${successCount}/${
        currentLevelPermissions.length
      } 条`
    )
    totalInserted += successCount

    // 查找下一层级的权限（父ID在当前层级中的权限）
    const currentLevelIds = new Set(currentLevelPermissions.map(p => p.id))
    const nextLevelPermissions = permissions.filter(
      p => p.parent_id !== null && currentLevelIds.has(p.parent_id)
    )

    // 如果下一层级有权限，则添加到层级映射中
    if (nextLevelPermissions.length > 0) {
      levelMap.set(level + 1, nextLevelPermissions)
    }
  }

  return totalInserted
}
