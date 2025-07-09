'use client'

import { useState, useEffect } from 'react'
import {
  User,
  UserCog,
  Trash2,
  Edit,
  Eye,
  Lock,
  UserPlus,
  UserCheck,
  UserX,
  ShieldAlert,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  CustomTable,
  useCustomTable,
  ColumnDef,
  RowAction,
  TableFilter
} from '@/components/custom-table'
import { toast } from 'react-hot-toast'
import { formatDate, formatDateTime } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  User as UserType,
  GetUsersParams,
  UserResponse,
  UserUpdate
} from '@/types/user'
import { Role } from '@/types/role'
import {
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser
} from '@/api/admin/users'
import { getRoles } from '@/api/admin/roles'

/**
 * Get user initials for avatar
 */
function getUserInitials(user: UserType): string {
  if (user.full_name) {
    return user.full_name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
  }
  if (user.user_name) {
    return user.user_name.charAt(0).toUpperCase()
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  return 'U'
}

/**
 * Get status badge
 */
function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-500">
          Active
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-amber-500 text-white">
          Pending
        </Badge>
      )
    case 'restricted':
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-100 text-red-800"
        >
          Restricted
        </Badge>
      )
    case 'banned':
      return <Badge variant="destructive">Banned</Badge>
    case 'inactive':
      return <Badge variant="outline">Inactive</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

/**
 * Get user role names
 */
function getUserRoleNames(roleName: string, key: number) {
  switch (roleName) {
    case 'admin':
      return (
        <Badge
          key={key}
          variant="outline"
          className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          admin
        </Badge>
      )
    case 'moderator':
      return (
        <Badge
          key={key}
          variant="outline"
          className="border-purple-200 bg-purple-100 text-purple-800 hover:bg-purple-200"
        >
          moderator
        </Badge>
      )
    case 'user':
      return (
        <Badge
          key={key}
          variant="outline"
          className="border-green-200 bg-green-100 text-green-800 hover:bg-green-200"
        >
          user
        </Badge>
      )
    default:
      return (
        <Badge
          key={key}
          variant="outline"
          className="border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          {roleName}
        </Badge>
      )
  }
}

/**
 * Get user role badges
 */
function getUserRoleBadges(roles: Role[] | any[] | null | undefined) {
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return <span className="text-xs text-muted-foreground">No roles</span>
  }

  return roles.map((role, key) => {
    const roleName = role.name || ''
    return getUserRoleNames(roleName, key)
  })
}

export default function UsersPage() {
  // Modal states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<UserType | null>(null)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editingUserData, setEditingUserData] = useState<UserUpdate>({})
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [isHardDelete, setIsHardDelete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Roles for selection
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Use the custom table hook
  const {
    data: users,
    loading,
    pagination,
    filters,
    refresh: refreshUsers,
    setPage,
    setPageSize,
    setFilters,
    operationStates
  } = useCustomTable<UserType, GetUsersParams>({
    fetchData: getUsers,
    defaultParams: {
      page: 1,
      pageSize: 10,
      searchTerm: '',
      status: '',
      role: ''
    }
  })

  // Define columns
  const columns: ColumnDef<UserType>[] = [
    {
      key: 'name',
      header: 'User',
      cell: row => (
        <div className="flex items-center space-x-2">
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={
                row.picture ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${row?.user_name || 'user'}`
              }
              alt={row.full_name || 'User'}
            />
            <AvatarFallback>{getUserInitials(row)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.full_name || row.user_name || 'Unnamed User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.user_name}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      cell: row => (
        <div className="max-w-[200px] truncate">
          <span className="text-xs">{row.email}</span>
        </div>
      ),
      hideOnMobile: true
    },
    {
      key: 'gender',
      header: 'Gender',
      cell: row => (
        <div className="text-xs">
          {row.gender === 'male' && 'Male'}
          {row.gender === 'female' && 'Female'}
          {row.gender === 'other' && 'Other'}
          {row.gender === 'prefer_not_to_say' && 'Prefer not to say'}
          {!row.gender && '-'}
        </div>
      ),
      hideOnMobile: true
    },
    {
      key: 'bio',
      header: 'Bio',
      cell: row => (
        <div className="max-w-[150px] truncate text-xs" title={row.bio || ''}>
          {row.bio || '-'}
        </div>
      ),
      hideOnMobile: true
    },
    {
      key: 'birthday',
      header: 'Birthday',
      cell: row => <div className="text-xs">{formatDate(row.birthday)}</div>,
      hideOnMobile: true
    },
    {
      key: 'role_names',
      header: 'Roles',
      cell: row => (
        <div className="flex flex-wrap gap-1">
          {getUserRoleBadges(row.roles)}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: row => <div>{getStatusBadge(row.status || '')}</div>
    },
    {
      key: 'last_login_at',
      header: 'Last Login',
      cell: row => (
        <div className="text-xs">
          {row.last_login_at ? formatDate(row.last_login_at) : 'Never'}
        </div>
      ),
      hideOnMobile: true
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: row => (
        <div className="text-xs">{formatDate(row.created_at || '')}</div>
      ),
      hideOnMobile: true
    }
  ]

  // Define row actions
  const rowActions: RowAction<UserType>[] = [
    {
      icon: Edit,
      label: 'Edit',
      operation: 'edit',
      className: 'text-amber-600',
      isLoading: id => operationStates.getLoadingId('edit') === id
    },
    {
      icon: Eye,
      label: 'View',
      operation: 'view',
      isLoading: id => operationStates.getLoadingId('view') === id
    },
    {
      icon: UserX,
      label: 'Ban',
      operation: 'ban',
      className: 'text-red-600',
      hideOn: row => row.status === 'banned' || row.status === 'inactive'
    },
    {
      icon: UserCheck,
      label: 'Activate',
      operation: 'activate',
      className: 'text-green-600',
      hideOn: row => row.status === 'active'
    },
    {
      icon: Trash2,
      label: 'Delete',
      operation: 'delete',
      className: 'text-destructive'
    }
  ]

  // Define filters
  const tableFilters: TableFilter[] = [
    {
      type: 'search',
      key: 'searchTerm',
      value: filters.searchTerm || '',
      placeholder: 'Search users...',
      onChange: value => setFilters({ searchTerm: value })
    },
    {
      type: 'select',
      key: 'status',
      value: filters.status || '',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'restricted', label: 'Restricted' },
        { value: 'banned', label: 'Banned' },
        { value: 'inactive', label: 'Inactive' }
      ],
      onChange: value => setFilters({ status: value })
    }
  ]

  // Load roles for selection
  const loadRoles = async () => {
    if (roles.length > 0) return roles // 已加载则直接返回

    try {
      setLoadingRoles(true)
      const rolesRes = await getRoles()
      console.log('rolesRes', rolesRes)
      if (
        rolesRes.success &&
        rolesRes.data &&
        Array.isArray(rolesRes.data.data)
      ) {
        setRoles(rolesRes.data.data)
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
      toast.error('Failed to load roles')
      return []
    } finally {
      setLoadingRoles(false)
    }
  }

  // Handle row actions
  const handleRowAction = async (
    operation: string,
    id: string,
    row: UserType
  ) => {
    switch (operation) {
      case 'view':
        try {
          operationStates.setLoadingId('view', id)
          const userDetails = await getUserDetails(id)
          setViewingUser(userDetails)
          setIsViewDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch user details:', error)
          toast.error('Failed to fetch user details')
        } finally {
          operationStates.setLoadingId('view', null)
        }
        break

      case 'edit':
        try {
          operationStates.setLoadingId('edit', id)

          // 确保角色数据加载完成
          await loadRoles()

          // 获取用户详情
          const userDetails = await getUserDetails(id)
          setEditingUser(userDetails)

          // 提取用户角色ID
          let roleIds: number[] = []

          if (
            userDetails.roles &&
            Array.isArray(userDetails.roles) &&
            userDetails.roles.length > 0
          ) {
            roleIds = userDetails.roles.map(role => role.id)
            console.log('用户角色列表:', userDetails.roles)
            console.log('提取的角色ID:', roleIds)
          }

          // 在初始化角色后再设置表单数据
          setEditingUserData({
            full_name: userDetails.full_name || '',
            nick_name: userDetails.nick_name || '',
            user_name: userDetails.user_name || '',
            email: userDetails.email || '',
            bio: userDetails.bio || '',
            gender: userDetails.gender || null,
            birthday: userDetails.birthday || '',
            status: userDetails.status,
            roleIds: roleIds
          })

          setIsEditDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch user details for editing:', error)
          toast.error('Failed to prepare user for editing')
        } finally {
          operationStates.setLoadingId('edit', null)
        }
        break

      case 'ban':
        try {
          operationStates.setLoadingId('ban', id)
          await updateUser(id, { status: 'banned' })
          await refreshUsers()
          toast.success('User banned successfully')
        } catch (error) {
          console.error('Failed to ban user:', error)
          toast.error('Failed to ban user')
        } finally {
          operationStates.setLoadingId('ban', null)
        }
        break

      case 'activate':
        try {
          operationStates.setLoadingId('activate', id)
          await updateUser(id, { status: 'active' })
          await refreshUsers()
          toast.success('User activated successfully')
        } catch (error) {
          console.error('Failed to activate user:', error)
          toast.error('Failed to activate user')
        } finally {
          operationStates.setLoadingId('activate', null)
        }
        break

      case 'delete':
        setDeletingUserId(id)
        setIsHardDelete(false)
        setIsDeleteDialogOpen(true)
        break
    }
  }

  // Handle deleting a user
  const handleDelete = async () => {
    if (!deletingUserId) return

    try {
      setIsSubmitting(true)
      await deleteUser(deletingUserId, isHardDelete)

      // Close dialog and reset state
      setIsDeleteDialogOpen(false)
      setDeletingUserId(null)
      setIsHardDelete(false)

      // Refresh user list
      await refreshUsers()

      toast.success(
        `User ${isHardDelete ? 'permanently deleted' : 'removed'} successfully`
      )
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form input change
  const handleInputChange = (field: string, value: any) => {
    setEditingUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle role selection change
  const handleRoleChange = (roleId: number, isChecked: boolean) => {
    console.log(`角色选择变更 - ID: ${roleId}, 选中: ${isChecked}`)

    setEditingUserData(prev => {
      const currentRoleIds = prev.roleIds || []
      console.log('当前选中角色IDs:', currentRoleIds)

      let newRoleIds: number[]
      if (isChecked) {
        // 确保添加的ID是数字类型
        newRoleIds = [...currentRoleIds, Number(roleId)]
      } else {
        newRoleIds = currentRoleIds.filter(id => id !== roleId)
      }

      console.log('更新后角色IDs:', newRoleIds)
      return {
        ...prev,
        roleIds: newRoleIds
      }
    })
  }

  // Submit edit form
  const handleEditSubmit = async () => {
    if (!editingUser) return

    try {
      setIsSubmitting(true)

      // 确保roleIds是有效的数组，并且所有ID都是数字类型
      let roleIds = Array.isArray(editingUserData.roleIds)
        ? editingUserData.roleIds
        : []
      // 确保所有ID都是数字类型
      roleIds = roleIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)

      // 处理所有字段，确保空字符串转为null
      const cleanedData = { ...editingUserData }
      const stringFields = [
        'full_name',
        'user_name',
        'bio',
        'gender',
        'birthday'
      ]
      stringFields.forEach(key => {
        if ((cleanedData as any)[key] === '') {
          ;(cleanedData as any)[key] = null
        }
      })

      const dataToSubmit = {
        ...cleanedData,
        roleIds
      }

      console.log('提交用户更新数据:', JSON.stringify(dataToSubmit, null, 2))

      // 尝试更新用户
      await updateUser(editingUser.id, dataToSubmit)

      // 关闭对话框并重置状态
      setIsEditDialogOpen(false)
      setEditingUser(null)
      setEditingUserData({})

      // 刷新用户列表
      await refreshUsers()

      toast.success('User updated successfully')
    } catch (error: any) {
      console.error('Failed to update user:', error)
      toast.error(`Failed to update user: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 在组件顶部添加初始化逻辑
  // 页面加载时预加载角色数据
  useEffect(() => {
    loadRoles().catch(err => {
      console.error('Failed to preload roles:', err)
    })
  }, [])

  return (
    <>
      <CustomTable
        data={users}
        columns={columns}
        loading={loading}
        idField="id"
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total
        }}
        onPaginationChange={({ page, pageSize }) => {
          if (page !== pagination.page) {
            setPage(page)
          }
          if (pageSize !== pagination.pageSize) {
            setPageSize(pageSize)
          }
        }}
        filters={tableFilters}
        rowActions={rowActions}
        onRowAction={handleRowAction}
        header={{
          title: 'User Management',
          description: 'Manage system users, assign roles and set permissions',
          actions: [
            {
              icon: UserPlus,
              label: 'Add User',
              onClick: () =>
                toast.error(
                  'User creation is handled by authentication system'
                ),
              variant: 'default',
              tooltip: 'New users are created through the authentication system'
            }
          ]
        }}
        emptyStateMessage="No matching users found"
      />

      {/* View User Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={open => {
          setIsViewDialogOpen(open)
          if (!open) setViewingUser(null)
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>

          {viewingUser && (
            <div className="grid gap-4 py-4">
              <div className="mb-4 flex items-center justify-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={
                      viewingUser.picture ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${viewingUser?.user_name || 'user'}`
                    }
                    alt={viewingUser.full_name || 'User'}
                  />
                  <AvatarFallback className="text-xl">
                    {getUserInitials(viewingUser)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">ID</Label>
                <div className="col-span-3">
                  <p className="overflow-auto text-sm break-all">
                    {viewingUser.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Full Name</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingUser.full_name || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Nickname</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingUser.nick_name || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Username</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingUser.user_name || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Email</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingUser.email || 'Not set'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-medium">Biography</Label>
                <div className="col-span-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {viewingUser.bio || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Gender</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingUser.gender === 'male' && 'Male'}
                    {viewingUser.gender === 'female' && 'Female'}
                    {viewingUser.gender === 'other' && 'Other'}
                    {viewingUser.gender === 'prefer_not_to_say' &&
                      'Prefer not to say'}
                    {!viewingUser.gender && 'Not set'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Birthday</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingUser.birthday
                      ? formatDate(viewingUser.birthday)
                      : 'Not set'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Roles</Label>
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-1">
                    {viewingUser.roles &&
                    Array.isArray(viewingUser.roles) &&
                    viewingUser.roles.length > 0 ? (
                      viewingUser.roles.map((role, index) =>
                        getUserRoleNames(role.name, index)
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No roles assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Status</Label>
                <div className="col-span-3">
                  {getStatusBadge(viewingUser.status || '')}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Is Deleted</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingUser.is_deleted ? 'Yes' : 'No'}
                    {viewingUser.deleted_at &&
                      ` (${formatDateTime(viewingUser.deleted_at)})`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Last Login</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingUser.last_login_at
                      ? formatDateTime(viewingUser.last_login_at)
                      : 'Never logged in'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {formatDateTime(viewingUser.created_at || '')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Updated At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {formatDateTime(viewingUser.updated_at || '')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="default"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={open => {
          setIsEditDialogOpen(open)
          if (!open) {
            setEditingUser(null)
            setEditingUserData({})
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and roles
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={editingUserData.full_name || ''}
                  onChange={e => handleInputChange('full_name', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nickName" className="text-right">
                  Nickname
                </Label>
                <Input
                  id="nickName"
                  value={editingUserData.nick_name || ''}
                  onChange={e => handleInputChange('nick_name', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userName" className="text-right">
                  Username
                </Label>
                <Input
                  id="userName"
                  value={editingUserData.user_name || ''}
                  onChange={e => handleInputChange('user_name', e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingUserData.email || ''}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className="col-span-3"
                  disabled={true}
                  title="Email cannot be changed as it's linked to authentication"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="bio" className="pt-2 text-right">
                  Biography
                </Label>
                <Textarea
                  id="bio"
                  value={editingUserData.bio || ''}
                  onChange={e => handleInputChange('bio', e.target.value)}
                  className="col-span-3 min-h-[80px]"
                  placeholder="Enter user biography..."
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Select
                  value={editingUserData.gender || undefined}
                  onValueChange={value =>
                    handleInputChange('gender', value === '' ? null : value)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="birthday" className="text-right">
                  Birthday
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !editingUserData.birthday && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingUserData.birthday ? (
                          format(new Date(editingUserData.birthday), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          editingUserData.birthday
                            ? new Date(editingUserData.birthday)
                            : undefined
                        }
                        onSelect={date =>
                          handleInputChange(
                            'birthday',
                            date ? format(date, 'yyyy-MM-dd') : null
                          )
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={editingUserData.status || editingUser.status}
                  onValueChange={value => handleInputChange('status', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select user status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Label className="pt-2 text-right">Roles</Label>
                <div className="col-span-3 max-h-[200px] overflow-y-auto rounded-md border p-3">
                  {loadingRoles ? (
                    <div className="text-sm text-muted-foreground">
                      Loading roles...
                    </div>
                  ) : roles.length > 0 ? (
                    roles.map(role => {
                      // 检查当前角色是否已选中
                      const isChecked = (
                        editingUserData.roleIds || []
                      ).includes(role.id)
                      return (
                        <div
                          key={role.id}
                          className="flex items-center space-x-2 py-1"
                        >
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={isChecked}
                            onCheckedChange={checked =>
                              handleRoleChange(role.id, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`role-${role.id}`}
                            className="flex-1 cursor-pointer text-sm font-normal"
                          >
                            {role.name}
                            {role.is_system && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                System
                              </Badge>
                            )}
                          </Label>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No roles available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleEditSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hardDelete"
                checked={isHardDelete}
                onCheckedChange={checked => setIsHardDelete(checked === true)}
              />
              <Label
                htmlFor="hardDelete"
                className="flex-1 cursor-pointer text-sm font-normal"
              >
                Permanently delete (hard delete)
              </Label>
            </div>
            <p className="mt-1 ml-6 text-xs text-muted-foreground">
              If unchecked, the user will be marked as deleted but data will be
              preserved
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
