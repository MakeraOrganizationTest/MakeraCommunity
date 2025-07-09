'use client'

import { useState } from 'react'
import { Shield, Trash2, Edit, Eye, Plus, Users } from 'lucide-react'
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
  CustomTable,
  useCustomTable,
  ColumnDef,
  RowAction,
  TableFilter
} from '@/components/custom-table'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/format'
import { Role, GetRolesParams, RoleWithPermissions } from '@/types/role'
import { Permission } from '@/types/permission'
import { CheckboxTree } from '@/components/checkbox-tree'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getRoles,
  getRoleDetails,
  createRole,
  updateRole,
  deleteRole
} from '@/api/admin/roles'
import { getPermissions } from '@/api/admin/permissions'

export default function RolesPage() {
  // 新增角色对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<
    Omit<Role, 'id' | 'created_at' | 'updated_at'> & { permissions: number[] }
  >({
    name: '',
    description: '',
    is_system: false,
    permissions: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 编辑角色对话框状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(
    null
  )

  // 查看角色详情对话框状态
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingRole, setViewingRole] = useState<RoleWithPermissions | null>(
    null
  )

  // 删除确认对话框状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null)

  // 权限列表状态
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)

  // 使用自定义表格Hook
  const {
    data: roles,
    loading,
    pagination,
    filters,
    refresh: refreshRoles,
    setPage,
    setPageSize,
    setFilters,
    operationStates
  } = useCustomTable<Role, GetRolesParams>({
    fetchData: getRoles,
    defaultParams: {
      page: 1,
      pageSize: 10,
      searchTerm: '',
      status: ''
    }
  })

  // 定义列配置
  const columns: ColumnDef<Role>[] = [
    {
      key: 'name',
      header: 'Role Name',
      cell: row => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.name}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      cell: row => (
        <div className="max-w-[300px] truncate">
          <span className="text-xs">{row.description}</span>
        </div>
      ),
      hideOnMobile: true
    },
    {
      key: 'is_system',
      header: 'System Role',
      cell: row => (
        <div>
          {row.is_system ? (
            <Badge variant="secondary" className="text-xs">
              System Role
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Custom Role</span>
          )}
        </div>
      )
    },
    {
      key: 'permission_count',
      header: 'Permissions',
      cell: row => (
        <div className="flex items-center space-x-1">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">{row.permission_count || 0}</span>
        </div>
      )
    },
    {
      key: 'user_count',
      header: 'Users',
      cell: row => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs">{row.user_count || 0}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: value => <span className="text-xs">{formatDate(value)}</span>,
      hideOnMobile: true
    },
    {
      key: 'updated_at',
      header: 'Updated At',
      render: value => <span className="text-xs">{formatDate(value)}</span>,
      hideOnMobile: true
    }
  ]

  // 定义行操作
  const rowActions: RowAction<Role>[] = [
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
      icon: Trash2,
      label: 'Delete',
      operation: 'delete',
      className: 'text-destructive'
    }
  ]

  // 定义筛选器
  const tableFilters: TableFilter[] = [
    {
      type: 'search',
      key: 'searchTerm',
      value: filters.searchTerm || '',
      placeholder: 'Search for role name or description...',
      onChange: value => setFilters({ searchTerm: value })
    }
  ]

  // 加载所有权限
  const loadPermissions = async () => {
    if (permissions.length > 0) return // 已加载过权限

    try {
      setLoadingPermissions(true)
      const response = await getPermissions({
        page: 1,
        pageSize: 10000,
        tree: true // 获取树形结构的权限数据
      })
      if (
        response.success &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        setPermissions(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
      toast.error('Failed to load permissions, please try again')
    } finally {
      setLoadingPermissions(false)
    }
  }

  // 处理行操作
  const handleRowAction = async (operation: string, id: number, row: Role) => {
    switch (operation) {
      case 'edit':
        try {
          operationStates.setLoadingId('edit', id)
          // 加载角色详情前先加载权限列表
          await loadPermissions()
          const response = await getRoleDetails(id)
          setEditingRole(response)
          setIsEditDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch role details:', error)
          toast.error('Failed to fetch role details, please try again')
        } finally {
          operationStates.setLoadingId('edit', null)
        }
        break

      case 'view':
        try {
          operationStates.setLoadingId('view', id)
          // 加载角色详情前先加载权限列表
          await loadPermissions()
          const response = await getRoleDetails(id)
          setViewingRole(response)
          setIsViewDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch role details:', error)
          toast.error('Failed to fetch role details, please try again')
        } finally {
          operationStates.setLoadingId('view', null)
        }
        break

      case 'delete':
        setDeletingRoleId(id)
        setIsDeleteDialogOpen(true)
        break
    }
  }

  // Handler to delete role
  const handleDelete = async () => {
    if (!deletingRoleId) return

    try {
      await deleteRole(deletingRoleId)

      // 关闭确认对话框
      setIsDeleteDialogOpen(false)
      setDeletingRoleId(null)

      // 刷新列表
      await refreshRoles()

      toast.success('Role deleted successfully')
    } catch (error) {
      console.error('Failed to delete role:', error)
      toast.error('Failed to delete role. Please try again')
    }
  }

  // 处理表单输入变化
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    // 针对checkbox类型特殊处理
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      setNewRole(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else {
      setNewRole(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // 处理权限选择变化
  const handlePermissionChange = (selectedIds: number[]) => {
    setNewRole(prev => ({
      ...prev,
      permissions: selectedIds
    }))
  }

  // 处理编辑表单输入变化
  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editingRole) return

    const { name, value } = e.target
    setEditingRole(prev => ({
      ...prev!,
      [name]: value
    }))
  }

  // 处理编辑权限选择变化
  const handleEditPermissionChange = (selectedIds: number[]) => {
    if (!editingRole) return

    setEditingRole(prev => ({
      ...prev!,
      permissions: selectedIds
    }))
  }

  // 提交编辑角色
  const handleEditSubmit = async () => {
    if (!editingRole) return

    // 表单验证
    if (!editingRole.name.trim()) {
      toast.error('Please enter role name')
      return
    }

    try {
      setIsSubmitting(true)
      const roleToUpdate = {
        name: editingRole.name,
        description: editingRole.description,
        permissions: editingRole.permissions.map(String)
      }

      await updateRole(editingRole.id, roleToUpdate)

      // 关闭对话框
      setIsEditDialogOpen(false)
      setEditingRole(null)

      // 刷新角色列表
      await refreshRoles()

      toast.success('Role updated successfully')
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 提交新增角色
  const handleSubmit = async () => {
    // 表单验证
    if (!newRole.name.trim()) {
      toast.error('Please enter role name')
      return
    }

    try {
      setIsSubmitting(true)
      await createRole(newRole)

      // 重置表单
      setNewRole({
        name: '',
        description: '',
        is_system: false,
        permissions: []
      })

      // 关闭对话框
      setIsAddDialogOpen(false)

      // 刷新角色列表
      await refreshRoles()

      toast.success('Role created successfully')
    } catch (error) {
      console.error('Failed to create role:', error)
      toast.error('Failed to create role. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 打开添加对话框
  const handleOpenAddDialog = async () => {
    await loadPermissions()
    setIsAddDialogOpen(true)
  }

  // 递归渲染权限树形视图（用于查看模式）
  const renderPermissionTreeView = (
    permission: Permission,
    selectedIds: number[],
    level = 0
  ) => {
    const hasChildren = permission.children && permission.children.length > 0
    const isSelected = selectedIds.includes(permission.id)

    // 检查自身或子项是否有选中的权限
    const hasSelectedDescendant =
      hasChildren &&
      permission.children!.some(
        child =>
          selectedIds.includes(child.id) ||
          (child.children &&
            child.children.some(grandchild =>
              selectedIds.includes(grandchild.id)
            ))
      )

    // 如果该权限及其子级都未被选中，则不显示
    if (!isSelected && !hasSelectedDescendant) {
      return null
    }

    return (
      <div key={permission.id} className="space-y-1">
        <div className="flex items-start">
          <div
            style={{ marginLeft: `${level * 20}px` }}
            className="flex items-center space-x-2"
          >
            {isSelected ? (
              <Badge
                variant="outline"
                className="bg-primary/10 hover:bg-primary/20"
              >
                {permission.name}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {permission.name}
              </span>
            )}
          </div>
        </div>

        {hasChildren && (
          <div className="mt-1">
            {permission.children!.map(child =>
              renderPermissionTreeView(child, selectedIds, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <CustomTable
        data={roles}
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
          title: 'Role Management',
          description: 'Manage system roles and assign permissions',
          actions: [
            {
              icon: Plus,
              label: 'Add Role',
              onClick: handleOpenAddDialog,
              variant: 'default',
              tooltip: false
            }
          ]
        }}
        emptyStateMessage="No matching roles found"
      />

      {/* Add Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Create a new system role by filling in the role details and
              assigning permissions
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={newRole.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g. Administrator"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={newRole.description}
                onChange={handleInputChange}
                placeholder="Enter role description..."
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_system" className="text-right">
                System Role
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  id="is_system"
                  name="is_system"
                  checked={newRole.is_system}
                  onCheckedChange={checked => {
                    setNewRole(prev => ({
                      ...prev,
                      is_system: checked === true
                    }))
                  }}
                />
                <Label
                  htmlFor="is_system"
                  className="cursor-pointer text-sm font-normal"
                >
                  Mark as system role
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Label className="pt-2 text-right">Permissions</Label>
              <div className="col-span-3">
                {loadingPermissions ? (
                  <div className="text-sm text-muted-foreground">
                    Loading permissions...
                  </div>
                ) : (
                  <CheckboxTree
                    options={permissions}
                    selectedValues={newRole.permissions}
                    onChange={handlePermissionChange}
                    maxHeight="350px"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={open => {
          setIsEditDialogOpen(open)
          if (!open) setEditingRole(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Edit role information and permissions
            </DialogDescription>
          </DialogHeader>

          {editingRole && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingRole.name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={editingRole.description}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Label className="pt-2 text-right">Permissions</Label>
                <div className="col-span-3">
                  {loadingPermissions ? (
                    <div className="text-sm text-muted-foreground">
                      Loading permissions...
                    </div>
                  ) : (
                    <>
                      {/* 添加权限选择状态调试信息 */}
                      <div className="mb-2 text-xs text-muted-foreground">
                        Selected permissions:{' '}
                        {editingRole.permissions.join(',')}
                      </div>
                      <CheckboxTree
                        options={permissions}
                        selectedValues={editingRole.permissions || []}
                        onChange={handleEditPermissionChange}
                        maxHeight="350px"
                      />
                    </>
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

      {/* View Role Details Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={open => {
          setIsViewDialogOpen(open)
          if (!open) setViewingRole(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Role Details</DialogTitle>
            <DialogDescription>
              View detailed information about this role
            </DialogDescription>
          </DialogHeader>

          {viewingRole && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">ID</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingRole.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Name</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingRole.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Description</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingRole.description || 'None'}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="pt-1 text-right font-medium">
                  Permissions
                </Label>
                <div className="col-span-3">
                  {viewingRole.permissions.length > 0 ? (
                    <div className="max-h-[300px] space-y-2 overflow-auto rounded-md border p-3">
                      {/* 递归展示权限树 */}
                      {permissions.map(perm => {
                        // 只渲染顶级权限
                        if (perm.parent_id === null) {
                          return renderPermissionTreeView(
                            perm,
                            viewingRole.permissions,
                            0
                          )
                        }
                        return null
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No permissions assigned
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">System Role</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingRole.is_system
                      ? 'Yes (System Default)'
                      : 'No (Custom Role)'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingRole.created_at
                      ? formatDate(viewingRole.created_at)
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Updated At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingRole.updated_at
                      ? formatDate(viewingRole.updated_at)
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">User Count</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingRole.user_count || 0} users</p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
