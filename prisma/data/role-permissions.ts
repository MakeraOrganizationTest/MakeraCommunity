import { PrismaClient } from '@/generated/prisma'

export async function assignAdminRolePermissions(prisma: PrismaClient) {
  console.log('开始为管理员角色分配权限...')

  // 获取管理员角色
  const adminRole = await prisma.roles.findUnique({
    where: { name: 'admin' }
  })

  if (!adminRole) {
    console.error('未找到管理员角色，无法分配权限')
    return []
  }

  // 获取所有权限ID
  const allPermissions = await prisma.permissions.findMany({
    select: { id: true }
  })

  // 为管理员角色分配所有权限
  const rolePermissionsData = allPermissions.map(permission => ({
    role_id: adminRole.id,
    permission_id: permission.id
  }))

  // 先删除此角色的所有现有权限
  await prisma.rolePermissions.deleteMany({
    where: { role_id: adminRole.id }
  })
  console.log(`已清除管理员角色的现有权限`)

  // 批量插入角色权限关联
  const rolePermissions = await Promise.all(
    rolePermissionsData.map(data =>
      prisma.rolePermissions
        .create({
          data: data
        })
        .catch(error => {
          console.error(
            `分配权限 ID: ${data.permission_id} 失败: ${error.message}`
          )
          return null // 返回 null 表示插入失败
        })
    )
  )

  // 统计成功分配的权限数量
  const successCount = rolePermissions.filter(rp => rp !== null).length
  console.log(
    `🎉 已为管理员角色成功分配 ${successCount}/${rolePermissionsData.length} 个权限`
  )

  return rolePermissions.filter(rp => rp !== null)
}
