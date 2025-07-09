import React from 'react'

export interface AdminNavigationItem {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  code: string
  items?: {
    icon?: React.ReactNode
    title: string
    url: string
    code: string
  }[]
}
