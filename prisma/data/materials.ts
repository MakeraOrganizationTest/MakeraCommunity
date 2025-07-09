import { PrismaClient } from '@/generated/prisma'

export async function seedMaterials(prisma: PrismaClient) {
  console.log('开始初始化材质类型...')

  const materialTypes = [
    { name: 'Hardwood', description: '硬木材料', is_metal: false },
    { name: 'Softwood', description: '软木材料', is_metal: false },
    { name: 'Plastic', description: '塑料材料', is_metal: false },
    { name: 'Aluminum', description: '铝合金材料', is_metal: true },
    { name: 'Copper', description: '铜材料', is_metal: true },
    { name: 'Brass', description: '黄铜材料', is_metal: true },
    { name: 'PCB', description: '印刷电路板材料', is_metal: false },
    { name: 'Carbon Fiber', description: '碳纤维材料', is_metal: false }
  ]

  // 使用 upsert 来避免重复插入
  const createdTypes: Array<{ id: string; name: string }> = []
  for (const materialType of materialTypes) {
    const result = await prisma.materialTypes.upsert({
      where: { name: materialType.name },
      update: {
        description: materialType.description,
        is_metal: materialType.is_metal,
        updated_at: new Date()
      },
      create: {
        name: materialType.name,
        description: materialType.description,
        is_metal: materialType.is_metal
      }
    })
    createdTypes.push({ id: result.id, name: result.name })
  }
  console.log(`🎉 材质类型初始化完成，共 ${materialTypes.length} 种类型`)

  console.log('开始初始化材质组...')

  // 创建材质分组 - 一级分组对应材质类型
  const materialGroups = [
    { id: 'hardwood-group', name: 'Hardwood', parent_id: null, order: 1 },
    { id: 'softwood-group', name: 'Softwood', parent_id: null, order: 2 },
    { id: 'plastic-group', name: 'Plastic', parent_id: null, order: 3 },
    { id: 'aluminum-group', name: 'Aluminum', parent_id: null, order: 4 },
    { id: 'copper-group', name: 'Copper', parent_id: null, order: 5 },
    { id: 'brass-group', name: 'Brass', parent_id: null, order: 6 },
    { id: 'pcb-group', name: 'PCB', parent_id: null, order: 7 },
    {
      id: 'carbon-fiber-group',
      name: 'Carbon Fiber',
      parent_id: null,
      order: 8
    }
  ]

  // 插入所有分组（都是顶级分组）
  for (const group of materialGroups) {
    await prisma.materialGroups.upsert({
      where: { id: group.id },
      update: {
        name: group.name,
        parent_id: group.parent_id,
        order: group.order,
        updated_at: new Date()
      },
      create: {
        id: group.id,
        name: group.name,
        parent_id: group.parent_id,
        order: group.order
      }
    })
  }
  console.log(`🎉 材质组初始化完成，共 ${materialGroups.length} 个材质组`)

  console.log('开始初始化材质...')

  // 获取类型ID映射
  const getTypeId = (typeName: string) => {
    return createdTypes.find(type => type.name === typeName)?.id || ''
  }

  const materials = [
    // Hardwood 硬木材料
    {
      name: 'Oak Board 20mm',
      type: 'Hardwood',
      group_id: 'hardwood-group',
      length: 1200,
      width: 600,
      height: 20,
      description: '优质橡木板材，质地坚硬，纹理美观'
    },
    {
      name: 'Walnut Board 15mm',
      type: 'Hardwood',
      group_id: 'hardwood-group',
      length: 1000,
      width: 500,
      height: 15,
      description: '胡桃木板材，纹理精美，适合精细加工'
    },
    {
      name: 'Cherry Board 18mm',
      type: 'Hardwood',
      group_id: 'hardwood-group',
      length: 800,
      width: 400,
      height: 18,
      description: '樱桃木板材，色泽温润，质感优良'
    },
    {
      name: 'Maple Board 22mm',
      type: 'Hardwood',
      group_id: 'hardwood-group',
      length: 1000,
      width: 600,
      height: 22,
      description: '枫木板材，质地坚硬，纹理细腻'
    },

    // Softwood 软木材料
    {
      name: 'Pine Board 25mm',
      type: 'Softwood',
      group_id: 'softwood-group',
      length: 1500,
      width: 800,
      height: 25,
      description: '松木板材，易于加工，价格实惠'
    },
    {
      name: 'Cedar Board 20mm',
      type: 'Softwood',
      group_id: 'softwood-group',
      length: 1200,
      width: 600,
      height: 20,
      description: '杉木板材，轻质环保，防腐性好'
    },
    {
      name: 'Fir Board 30mm',
      type: 'Softwood',
      group_id: 'softwood-group',
      length: 1800,
      width: 900,
      height: 30,
      description: '冷杉板材，结构稳定，适合结构件'
    },

    // Plastic 塑料材料
    {
      name: 'Acrylic Sheet 5mm',
      type: 'Plastic',
      group_id: 'plastic-group',
      length: 1000,
      width: 600,
      height: 5,
      description: '透明亚克力板，光学性能好，易加工'
    },
    {
      name: 'ABS Plate 8mm',
      type: 'Plastic',
      group_id: 'plastic-group',
      length: 1000,
      width: 500,
      height: 8,
      description: 'ABS工程塑料板，韧性好，耐冲击'
    },
    {
      name: 'POM Sheet 10mm',
      type: 'Plastic',
      group_id: 'plastic-group',
      length: 500,
      width: 300,
      height: 10,
      description: 'POM聚甲醛板材，尺寸稳定性好'
    },
    {
      name: 'PEEK Plate 6mm',
      type: 'Plastic',
      group_id: 'plastic-group',
      length: 300,
      width: 200,
      height: 6,
      description: 'PEEK高性能塑料，耐高温耐化学'
    },

    // Aluminum 铝合金材料
    {
      name: '6061 Aluminum Plate 3mm',
      type: 'Aluminum',
      group_id: 'aluminum-group',
      length: 1000,
      width: 500,
      height: 3,
      description: '6061铝合金板材，强度高，耐腐蚀'
    },
    {
      name: '6063 Aluminum Profile',
      type: 'Aluminum',
      group_id: 'aluminum-group',
      length: 3000,
      width: 40,
      height: 40,
      description: '6063铝合金型材，表面处理好，易连接'
    },
    {
      name: '7075 Aluminum Plate 5mm',
      type: 'Aluminum',
      group_id: 'aluminum-group',
      length: 800,
      width: 400,
      height: 5,
      description: '7075高强度铝板，航空级材料'
    },
    {
      name: '2024 Aluminum Sheet 4mm',
      type: 'Aluminum',
      group_id: 'aluminum-group',
      length: 600,
      width: 300,
      height: 4,
      description: '2024铝合金板，高强度，适合结构件'
    },

    // Copper 铜材料
    {
      name: 'Pure Copper Sheet 2mm',
      type: 'Copper',
      group_id: 'copper-group',
      length: 500,
      width: 300,
      height: 2,
      description: '紫铜板材，导电性极佳，纯度高'
    },
    {
      name: 'Copper Plate 1.5mm',
      type: 'Copper',
      group_id: 'copper-group',
      length: 400,
      width: 200,
      height: 1.5,
      description: '铜板材，导热导电性好，易加工'
    },
    {
      name: 'Copper Foil 0.1mm',
      type: 'Copper',
      group_id: 'copper-group',
      length: 1000,
      width: 100,
      height: 0.1,
      description: '铜箔材料，用于电路制作'
    },

    // Brass 黄铜材料
    {
      name: 'Brass Sheet H62 2mm',
      type: 'Brass',
      group_id: 'brass-group',
      length: 500,
      width: 300,
      height: 2,
      description: 'H62黄铜板材，强度好，耐腐蚀'
    },
    {
      name: 'Brass Plate H65 3mm',
      type: 'Brass',
      group_id: 'brass-group',
      length: 400,
      width: 250,
      height: 3,
      description: 'H65黄铜板，塑性好，易成型'
    },
    {
      name: 'Brass Rod 10mm',
      type: 'Brass',
      group_id: 'brass-group',
      length: 1000,
      width: 10,
      height: 10,
      description: '黄铜棒材，机械性能优良'
    },

    // PCB 印刷电路板材料
    {
      name: 'FR4 PCB 1.6mm',
      type: 'PCB',
      group_id: 'pcb-group',
      length: 100,
      width: 80,
      height: 1.6,
      description: 'FR4玻璃纤维PCB，标准厚度，绝缘性好'
    },
    {
      name: 'FR4 PCB 0.8mm',
      type: 'PCB',
      group_id: 'pcb-group',
      length: 50,
      width: 30,
      height: 0.8,
      description: 'FR4薄板PCB，适合小型设备'
    },
    {
      name: 'Aluminum PCB 2mm',
      type: 'PCB',
      group_id: 'pcb-group',
      length: 100,
      width: 50,
      height: 2,
      description: '铝基PCB，散热性能好，适合LED应用'
    },
    {
      name: 'Flexible PCB 0.2mm',
      type: 'PCB',
      group_id: 'pcb-group',
      length: 100,
      width: 20,
      height: 0.2,
      description: '柔性PCB，可弯曲，适合移动设备'
    },

    // Carbon Fiber 碳纤维材料
    {
      name: 'Carbon Fiber Sheet 2mm',
      type: 'Carbon Fiber',
      group_id: 'carbon-fiber-group',
      length: 400,
      width: 200,
      height: 2,
      description: '碳纤维板材，轻量高强度，刚性好'
    },
    {
      name: 'Carbon Fiber Plate 3mm',
      type: 'Carbon Fiber',
      group_id: 'carbon-fiber-group',
      length: 300,
      width: 150,
      height: 3,
      description: '厚碳纤维板，超高强度，用于结构件'
    },
    {
      name: 'Carbon Fiber Tube 20mm',
      type: 'Carbon Fiber',
      group_id: 'carbon-fiber-group',
      length: 1000,
      width: 20,
      height: 20,
      description: '碳纤维管材，轻量化结构，强度极高'
    },
    {
      name: 'Carbon Fiber Rod 10mm',
      type: 'Carbon Fiber',
      group_id: 'carbon-fiber-group',
      length: 500,
      width: 10,
      height: 10,
      description: '碳纤维棒材，高模量，适合精密结构'
    }
  ]

  for (const material of materials) {
    const typeId = getTypeId(material.type)
    if (!typeId) {
      console.error(`⚠️ 未找到材质类型: ${material.type}`)
      continue
    }

    // 先尝试查找是否存在同名材质
    const existingMaterial = await prisma.materials.findFirst({
      where: { name: material.name }
    })

    if (existingMaterial) {
      // 更新现有材质
      await prisma.materials.update({
        where: { id: existingMaterial.id },
        data: {
          type_id: typeId,
          group_id: material.group_id,
          length: material.length,
          width: material.width,
          height: material.height,
          description: material.description,
          updated_at: new Date()
        }
      })
    } else {
      // 创建新材质
      await prisma.materials.create({
        data: {
          name: material.name,
          type_id: typeId,
          group_id: material.group_id,
          length: material.length,
          width: material.width,
          height: material.height,
          description: material.description
        }
      })
    }
  }

  console.log(`🎉 材质初始化完成，共 ${materials.length} 种材质`)
}
