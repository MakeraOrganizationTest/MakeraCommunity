import { PrismaClient } from '@/generated/prisma'

export async function seedCategories(prisma: PrismaClient) {
  console.log('开始初始化模型分类...')

  // Example category data, with parent-child structure
  const categories = await Promise.all([
    // Top-level category
    prisma.projectCategories.upsert({
      where: { slug: 'mechanical' },
      update: {
        name: 'Mechanical Parts',
        description: 'Various mechanical-related parts',
        order: 1,
        is_active: true,
        updated_at: new Date(),
        parent_id: null
      },
      create: {
        name: 'Mechanical Parts',
        slug: 'mechanical',
        description: 'Various mechanical-related parts',
        order: 1,
        is_active: true,
        parent_id: null
      }
    }),
    prisma.projectCategories.upsert({
      where: { slug: 'art' },
      update: {
        name: 'Art & Design',
        description: 'Art, sculpture, decoration and other design models',
        order: 2,
        is_active: true,
        updated_at: new Date(),
        parent_id: null
      },
      create: {
        name: 'Art & Design',
        slug: 'art',
        description: 'Art, sculpture, decoration and other design models',
        order: 2,
        is_active: true,
        parent_id: null
      }
    }),
    // Sub-category (under Mechanical Parts)
    prisma.projectCategories.upsert({
      where: { slug: 'gear' },
      update: {
        name: 'Gear',
        description: 'Various gear models',
        order: 1,
        is_active: true,
        updated_at: new Date(),
        parent_id:
          (
            await prisma.projectCategories.findUnique({
              where: { slug: 'mechanical' }
            })
          )?.id || null
      },
      create: {
        name: 'Gear',
        slug: 'gear',
        description: 'Various gear models',
        order: 1,
        is_active: true,
        parent_id:
          (
            await prisma.projectCategories.findUnique({
              where: { slug: 'mechanical' }
            })
          )?.id || null
      }
    }),
    prisma.projectCategories.upsert({
      where: { slug: 'bearing' },
      update: {
        name: 'Bearing',
        description: 'Various bearing models',
        order: 2,
        is_active: true,
        updated_at: new Date(),
        parent_id:
          (
            await prisma.projectCategories.findUnique({
              where: { slug: 'mechanical' }
            })
          )?.id || null
      },
      create: {
        name: 'Bearing',
        slug: 'bearing',
        description: 'Various bearing models',
        order: 2,
        is_active: true,
        parent_id:
          (
            await prisma.projectCategories.findUnique({
              where: { slug: 'mechanical' }
            })
          )?.id || null
      }
    }),
    // Sub-category (under Art & Design)
    prisma.projectCategories.upsert({
      where: { slug: 'sculpture' },
      update: {
        name: 'Sculpture',
        description: 'Sculpture art related models',
        order: 1,
        is_active: true,
        updated_at: new Date(),
        parent_id:
          (
            await prisma.projectCategories.findUnique({
              where: { slug: 'art' }
            })
          )?.id || null
      },
      create: {
        name: 'Sculpture',
        slug: 'sculpture',
        description: 'Sculpture art related models',
        order: 1,
        is_active: true,
        parent_id:
          (
            await prisma.projectCategories.findUnique({
              where: { slug: 'art' }
            })
          )?.id || null
      }
    })
  ])

  console.log(`🎉 初始化模型分类完成`)
  return categories
}
