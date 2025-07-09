/**
 * 将扁平结构的数据转换为树结构
 * @param items 扁平结构的数据数组
 * @param options 配置选项，包括id字段名、父id字段名和子节点字段名
 * @returns 树形结构的数据
 */
export function buildTree<T>(
  items: T[],
  options: {
    idField?: string
    parentField?: string
    childrenField?: string
  } = {}
): T[] {
  const {
    idField = 'id',
    parentField = 'parent_id',
    childrenField = 'children'
  } = options

  // 创建一个映射表，以 id 为键
  const itemMap: Record<string | number, any> = {}

  // 将所有项添加到映射表，并初始化子节点数组
  items.forEach(item => {
    const id = (item as any)[idField]
    itemMap[id] = {
      ...item,
      [childrenField]: []
    }
  })

  // 构建树结构
  const tree: T[] = []

  items.forEach(item => {
    const id = (item as any)[idField]
    const parentId = (item as any)[parentField]
    const itemWithChildren = itemMap[id]

    if (parentId === null) {
      // 顶级节点直接加入树
      tree.push(itemWithChildren)
    } else if (itemMap[parentId]) {
      // 子节点加入到父节点的 children 数组
      itemMap[parentId][childrenField].push(itemWithChildren)
    }
  })

  return tree
}

/**
 * 扁平化树结构
 * @param treeData 树结构数据
 * @param level 当前节点层级
 * @param options 配置选项
 * @returns 扁平化后的数据
 */
export function flattenTree<T>(
  treeData: any[],
  level = 0,
  options: {
    childrenField?: string
    levelField?: string
    isExpandedFn?: (item: any) => boolean
  } = {}
): T[] {
  const {
    childrenField = 'children',
    levelField = 'level',
    isExpandedFn
  } = options

  let result: any[] = []

  treeData.forEach(item => {
    // 添加当前节点，标记层级
    const currentItem = { ...item, [levelField]: level }
    result.push(currentItem)

    // 如果有子节点且节点是展开的，递归处理子节点
    const hasChildren = item[childrenField] && item[childrenField].length > 0
    const isExpanded = isExpandedFn ? isExpandedFn(item) : true

    if (hasChildren && isExpanded) {
      const childrenWithLevel = flattenTree(
        item[childrenField],
        level + 1,
        options
      )
      result = [...result, ...childrenWithLevel]
    }
  })

  return result
}

/**
 * 通过id查找树节点
 * @param treeData 树结构数据
 * @param id 目标节点id
 * @param options 配置选项
 * @returns 匹配的节点或undefined
 */
export function findNodeById<T>(
  treeData: T[],
  id: string | number,
  options: {
    idField?: string
    childrenField?: string
    nameField?: string
  } = {}
): { id: string; name: string } | undefined {
  const {
    idField = 'id',
    childrenField = 'children',
    nameField = 'name'
  } = options
  for (const node of treeData) {
    if ((node as any)[idField] === id) {
      return {
        id: (node as any)[idField],
        name: (node as any)[nameField]
      }
    }
    const children = (node as any)[childrenField]
    if (children && Array.isArray(children)) {
      const found = findNodeById(children, id, options)
      if (found) return found
    }
  }
  return undefined
}
