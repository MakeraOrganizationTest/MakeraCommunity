/**
 * 项目创建者信息
 */
export interface ProjectCreator {
  id: string
  nick_name?: string
  user_name?: string
  picture?: string
}

/**
 * 项目分类信息
 */
export interface ProjectCategory {
  id: number | string
  name: string
  slug: string
  description?: string
  parent_id?: number
  order: number | string
}

/**
 * 项目分类树节点信息
 */
export interface ProjectCategoryNode extends ProjectCategory {
  children?: ProjectCategoryNode[]
}

/**
 * 项目许可证信息
 */
export interface ProjectLicense {
  id: number | string
  name: string
  code?: string
  description?: string
  thumbnail?: string
}

/**
 * 项目标签信息
 */
export interface ProjectTag {
  id: number | string
  name: string
}

/**
 * 项目文件信息
 */
export interface ProjectFile {
  id: number
  name: string
  description?: string
  file_path: string
  file_size?: number
  file_type?: string
  last_modified?: number
  thumbnail: string
  downloads?: number
  preview_model_path?: string
  order?: number
  cutters: {
    name?: string
    id?: string | number
  }[][]
  blank: {
    name?: string
    id?: string | number
  }[]
  created_at: string
  updated_at: string
}

/**
 * 项目原始文件信息
 */
export interface ProjectOriginalFile {
  id: string
  name: string
  description?: string
  file_path: string
  file_size?: number
  file_type?: string
  thumbnail?: string
  created_at: string
  updated_at: string
  last_modified?: number
}

/**
 * 项目详细信息
 */
export interface Project {
  id: string
  name: string | null
  slug: string | null
  description: string | null
  creation_type: 'original' | 'derivative'
  derivative_sources: string[]
  cover_web: string | null
  cover_mobile: string | null
  gallery: string[]
  status:
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'published'
    | 'archived'
  visibility: 'public' | 'private'
  likes_count: number
  favorites_count: number
  comments_count: number
  downloads_count: number
  views_count: number
  shares_count: number
  is_featured: boolean
  is_liked?: boolean // 当前用户是否点赞了该项目（仅登录用户返回）
  created_at: string
  updated_at: string
  creator: ProjectCreator
  categories: ProjectCategory[]
  license: ProjectLicense | null
  tags: ProjectTag[]
  files: ProjectFile[]
  original_files: ProjectOriginalFile[]
}

/**
 * 项目创建/更新参数
 */
export interface ProjectParams {
  id?: string
  name?: string
  slug?: string
  description?: string
  creation_type?: 'original' | 'derivative'
  derivative_sources?: string[]
  category_id?: number
  license_id?: string
  cover_web?: string
  cover_mobile?: string
  gallery?: string[]
  status?:
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'published'
    | 'archived'
  visibility?: 'public' | 'private'
  is_featured?: boolean
  tag_ids?: number[]
}

/**
 * 项目文件创建/更新参数
 */
export interface ProjectFileParams {
  id?: string
  project_id?: string
  name?: string
  file_name?: string
  description?: string
  file_path?: string
  file_size?: number
  file_type?: string
  last_modified?: number
  thumbnail?: string
  preview_model_path?: string
  order?: number
  cutters?: {
    name?: string
    id?: string | number
  }[][]
  blank?: {
    name?: string
    id?: string | number
  }[]
  parameters?: object
}

/**
 * 项目原始文件创建/更新参数
 */
export interface ProjectOriginalFileParams {
  id?: string
  project_id?: string
  name?: string
  file_name?: string
  description?: string
  file_path?: string
  file_size?: number
  file_type?: string
  thumbnail?: string
  last_modified?: number
}
