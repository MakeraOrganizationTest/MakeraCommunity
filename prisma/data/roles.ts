import { PrismaClient } from '@/generated/prisma'

export async function seedRoles(prisma: PrismaClient) {
  console.log('开始初始化角色数据...')

  const roles = await Promise.all([
    prisma.roles.upsert({
      where: { name: 'admin' },
      update: {
        description: '系统管理员，拥有最高权限',
        is_system: true,
        updated_at: new Date()
      },
      create: {
        name: 'admin',
        description: '系统管理员，拥有最高权限',
        is_system: true
      }
    }),
    prisma.roles.upsert({
      where: { name: 'moderator' },
      update: {
        description: '内容审核员，负责内容管理和社区治理',
        is_system: true,
        updated_at: new Date()
      },
      create: {
        name: 'moderator',
        description: '内容审核员，负责内容管理和社区治理',
        is_system: true
      }
    }),
    prisma.roles.upsert({
      where: { name: 'user' },
      update: {
        description: '普通用户，基础访问权限',
        is_system: true,
        updated_at: new Date()
      },
      create: {
        name: 'user',
        description: '普通用户，基础访问权限',
        is_system: true
      }
    })
  ])

  console.log(`🎉 已创建/更新 ${roles.length} 个系统角色`)
  return roles
}
