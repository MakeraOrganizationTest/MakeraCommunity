export interface MaterialGroupNode {
  name: string
  id: string
  parent_id?: string | null
  order: number
  children?: (MaterialGroupNode | MaterialNode)[]
}

export interface MaterialNode {
  id: string
  name: string
  type_id: string
  group_id?: string | null
  type: string
}
