export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      permissions: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: number
          name: string | null
          parent_id: number | null
          type: Database['public']['Enums']['permission_type'] | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: number
          name?: string | null
          parent_id?: number | null
          type?: Database['public']['Enums']['permission_type'] | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: number
          name?: string | null
          parent_id?: number | null
          type?: Database['public']['Enums']['permission_type'] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'permissions_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'permissions'
            referencedColumns: ['id']
          }
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: number
          permission_id: number
          role_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          permission_id: number
          role_id: number
        }
        Update: {
          created_at?: string
          id?: number
          permission_id?: number
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'role_permissions_permission_id_fkey'
            columns: ['permission_id']
            isOneToOne: false
            referencedRelation: 'permissions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'role_permissions_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          }
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: number
          role_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          role_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          role_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          gender: Database['public']['Enums']['gender_type'] | null
          id: string
          is_deleted: boolean
          last_login_at: string | null
          status: Database['public']['Enums']['user_status']
          updated_at: string
          user_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: Database['public']['Enums']['gender_type'] | null
          id: string
          is_deleted?: boolean
          last_login_at?: string | null
          status?: Database['public']['Enums']['user_status']
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: Database['public']['Enums']['gender_type'] | null
          id?: string
          is_deleted?: boolean
          last_login_at?: string | null
          status?: Database['public']['Enums']['user_status']
          updated_at?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      roles_with_counts: {
        Row: {
          created_at: string | null
          description: string | null
          id: number | null
          is_system: boolean | null
          name: string | null
          permission_count: number | null
          updated_at: string | null
          user_count: number | null
        }
        Relationships: []
      }
      users_with_roles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          gender: Database['public']['Enums']['gender_type'] | null
          id: string | null
          is_deleted: boolean | null
          last_login_at: string | null
          roles: Json | null
          status: Database['public']['Enums']['user_status'] | null
          updated_at: string | null
          user_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      sync_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      gender_type: 'male' | 'female' | 'other' | 'prefer_not_to_say'
      permission_type: 'system' | 'page' | 'module' | 'operation' | 'data'
      user_status: 'active' | 'pending' | 'restricted' | 'banned' | 'inactive'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
