import { PrismaClient } from '@/generated/prisma'
import cutterGroupData from './json/cutter_group.json'
import cutterData from './json/cutter.json'

export async function seedCutters(prisma: PrismaClient) {
  console.log('开始初始化刀具类型...')

  const cutterTypes = [
    { name: 'Ball Nose', description: '球头铣刀', id: 0 },
    { name: 'Flat End', description: '平底铣刀', id: 1 },
    { name: 'V-Bit', description: 'V型刻刀', id: 2 },
    { name: 'Engraving', description: '雕刻刀', id: 3 },
    { name: 'Bull Nose', description: '牛鼻铣刀', id: 4 },
    { name: 'Drill', description: '钻头', id: 5 },
    { name: 'Thread', description: '螺纹刀', id: 6 }
  ]

  // 使用 upsert 来避免重复插入
  for (const cutterType of cutterTypes) {
    await prisma.cutterTypes.upsert({
      where: { name: cutterType.name },
      update: {
        description: cutterType.description,
        updated_at: new Date()
      },
      create: {
        name: cutterType.name,
        description: cutterType.description
      }
    })
  }
  console.log(`🎉 刀具类型初始化完成，共 ${cutterTypes.length} 种类型`)

  console.log('开始初始化刀具组...')

  const cutterGroups = cutterGroupData.RECORDS
  // 先插入顶级分组（parentId 为 null 的）
  const topLevelGroups = cutterGroups.filter(group => group.parentId === null)
  for (const group of topLevelGroups) {
    await prisma.cutterGroups.upsert({
      where: { id: group.id },
      update: {
        name: group.name,
        parent_id: group.parentId,
        updated_at: new Date()
      },
      create: {
        id: group.id,
        name: group.name,
        parent_id: group.parentId,
        order: 0
      }
    })
  }
  // 再插入子分组（有 parentId 的）
  const childGroups = cutterGroups.filter(group => group.parentId !== null)
  for (const group of childGroups) {
    await prisma.cutterGroups.upsert({
      where: { id: group.id },
      update: {
        name: group.name,
        parent_id: group.parentId,
        updated_at: new Date()
      },
      create: {
        id: group.id,
        name: group.name,
        parent_id: group.parentId,
        order: 0
      }
    })
  }
  console.log(`🎉 刀具组初始化完成，共 ${cutterGroups.length} 个分组`)

  console.log('开始初始化刀具...')
  // 获取所有刀具类型，用于 ID 映射
  const allCutterTypes = await prisma.cutterTypes.findMany()
  // 创建类型 ID 映射表：JSON 中的 cutterTypeId -> 数据库中的实际 type_id
  const typeIdMap = new Map<string, string>()
  cutterTypes.forEach(type => {
    const dbType = allCutterTypes.find(dbType => dbType.name === type.name)
    if (dbType) {
      typeIdMap.set(type.id.toString(), dbType.id)
    }
  })

  const cutters = cutterData.RECORDS

  for (const cutter of cutters) {
    // 获取对应的类型 ID
    const typeId = typeIdMap.get(cutter.cutterTypeId)
    if (!typeId) {
      console.error(`⚠️ 未找到类型 ID 映射: ${cutter.cutterTypeId}`)
      return
    }

    const cutterObj = {
      name: cutter.cutterName,
      type_id: typeId,
      group_id: cutter.groupId,
      diameter: cutter.cutterDiameter,
      tip_diameter: cutter.cutterTipDiameter,
      hole_diameter: cutter.holeDiameter,
      taper_angle: cutter.cutterAngle,
      half_angle: cutter.cutterHalfAngle,
      corner_radius: cutter.cutterCornerRadius,
      screw_pitch: cutter.screwPitch,
      specification: cutter.specification
    }

    await prisma.cutters.upsert({
      where: { id: cutter.cutterId },
      update: {
        ...cutterObj,
        updated_at: new Date()
      },
      create: {
        id: cutter.cutterId,
        ...cutterObj
      }
    })
  }

  console.log(`🎉 刀具初始化完成成功`)
}
