export interface CutterGroupNode {
  name: string
  id: string
  parent_id?: string | null
  order: number
  children?: (CutterGroupNode | CutterNode)[]
}

export interface CutterNode {
  id: string
  name: string
  type_id: string
  disabled?: boolean
  group_id?: string | null
  type: string
}

export interface CutterType {
  id: string
  name: string
}
