import { PrismaClient } from '@/generated/prisma'

import { seedLicenses } from './licenses'
import { seedRoles } from './roles'
import { seedPermissions } from './permissions'
import { assignAdminRolePermissions } from './role-permissions'
import { seedCategories } from './categories'
import { seedCutters } from './cutters'
import { seedMaterials } from './materials'

// 初始化 Prisma 客户端
const prisma = new PrismaClient()

async function main() {
  console.log('开始执行数据库种子脚本...')

  try {
    // 插入基本系统角色数据
    await seedRoles(prisma)

    // 逐级插入权限数据
    await seedPermissions(prisma)

    // 为管理员角色分配所有权限
    await assignAdminRolePermissions(prisma)

    // 创建基本许可证数据
    await seedLicenses(prisma)

    // 创建基本模型分类数据
    await seedCategories(prisma)

    // 初始化刀具
    await seedCutters(prisma)

    // 初始化材质
    await seedMaterials(prisma)

    console.log('数据库种子脚本执行完成')
  } catch (error) {
    console.error('种子脚本执行出错:', error)
  }
}

// 执行种子脚本
main()
  .catch(e => {
    console.error('种子脚本执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    // 关闭 Prisma 客户端连接
    await prisma.$disconnect()
  })
