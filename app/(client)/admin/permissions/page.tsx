'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Shield,
  Trash2,
  Edit,
  Eye,
  Plus,
  ChevronRight,
  ChevronDown,
  FolderTree
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
import { Permission, GetPermissionsParams } from '@/types/permission'
import { buildTree, flattenTree } from '@/lib/tree'
import {
  getPermissions,
  getPermissionDetails,
  createPermission,
  updatePermission,
  deletePermission
} from '@/api/admin/permissions'

export default function PermissionsPage() {
  // Add permission dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPermission, setNewPermission] = useState<
    Omit<Permission, 'id' | 'created_at' | 'updated_at'>
  >({
    name: '',
    code: '',
    description: '',
    type: 'page',
    parent_id: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit permission dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  )

  // View permission details dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingPermission, setViewingPermission] = useState<Permission | null>(
    null
  )

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingPermissionId, setDeletingPermissionId] = useState<
    number | null
  >(null)

  // Tree structure expansion state
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  // Use custom table hook
  const {
    data: permissions,
    loading,
    pagination,
    filters,
    refresh: refreshPermissions,
    setPage,
    setPageSize,
    setFilters,
    operationStates
  } = useCustomTable<Permission, GetPermissionsParams>({
    fetchData: getPermissions,
    defaultParams: {
      page: 1,
      pageSize: 10000, // 设置一个很大的值以获取所有数据
      searchTerm: '',
      type: '',
      tree: false
    }
  })

  // 确保只初始化一次展开状态
  const [initialized, setInitialized] = useState(false)

  // 当权限数据加载完成后，默认展开第一级节点
  useEffect(() => {
    if (permissions && permissions.length > 0 && !initialized) {
      const initialExpandState: Record<number, boolean> = {}

      // 设置顶级节点为展开状态
      permissions.forEach(permission => {
        if (permission.children && permission.children.length > 0) {
          initialExpandState[permission.id] = true
        }
      })

      // 确保有状态要设置才更新
      if (Object.keys(initialExpandState).length > 0) {
        setExpandedRows(initialExpandState)
        setInitialized(true)
      }
    }
  }, [permissions, initialized])

  // Expand/collapse row
  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Define column configuration
  const columns: ColumnDef<Permission>[] = [
    {
      key: 'name',
      header: 'Permission Name',
      cell: row => {
        const hasChildren = row.children && row.children.length > 0
        const isExpanded = expandedRows[row.id] || false
        const level = row.level || 0

        return (
          <div className="flex items-center space-x-2">
            <div
              style={{ marginLeft: `${level * 16}px` }}
              className="flex items-center"
            >
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0"
                  onClick={e => {
                    e.stopPropagation()
                    toggleRow(row.id)
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-5"></div>
              )}
              <Shield
                className={`h-4 w-4 ${
                  level > 0 ? 'text-muted-foreground/70' : 'text-primary'
                } ml-1`}
              />
              <span className={`text-sm ${level === 0 ? 'font-medium' : ''}`}>
                {row.name}
              </span>
              {row.children && row.children.length > 0 && !isExpanded && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({row.children.length})
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'code',
      header: 'Permission Code',
      render: value => (
        <span className="text-xs text-muted-foreground">{value}</span>
      ),
      hideOnMobile: true
    },
    {
      key: 'parent_id',
      header: 'Parent',
      cell: row => (
        <span className="text-xs">
          {row.parent_id ? `#${row.parent_id}` : '-'}
        </span>
      ),
      hideOnMobile: true
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
      key: 'type',
      header: 'Type',
      cell: row => getTypeBadge(row.type)
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

  // Define row operations
  const rowActions: RowAction<Permission>[] = [
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

  // 定义类型选项，避免在渲染中重复创建
  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'system', label: 'System' },
    { value: 'page', label: 'Page' },
    { value: 'module', label: 'Module' },
    { value: 'operation', label: 'Operation' },
    { value: 'data', label: 'Data' }
  ]

  // Define filters
  const tableFilters: TableFilter[] = [
    {
      type: 'search',
      key: 'searchTerm',
      value: filters.searchTerm || '',
      placeholder: 'Search for permission name, code or description...',
      onChange: value => setFilters({ searchTerm: value })
    },
    {
      type: 'select',
      key: 'type',
      value: filters.type || 'all',
      placeholder: 'Select type',
      options: typeFilterOptions,
      onChange: value => setFilters({ type: value })
    }
  ]

  // Return type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'system':
        return (
          <Badge variant="default" className="bg-blue-500">
            System
          </Badge>
        )
      case 'page':
        return (
          <Badge variant="default" className="bg-green-500">
            Page
          </Badge>
        )
      case 'module':
        return (
          <Badge variant="default" className="bg-purple-500">
            Module
          </Badge>
        )
      case 'operation':
        return (
          <Badge variant="default" className="bg-amber-500">
            Operation
          </Badge>
        )
      case 'data':
        return (
          <Badge variant="default" className="bg-rose-500">
            Data
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // Handle row operations
  const handleRowAction = async (
    operation: string,
    id: number,
    row: Permission
  ) => {
    switch (operation) {
      case 'edit':
        try {
          operationStates.setLoadingId('edit', id)
          const permission = await getPermissionDetails(id)
          setEditingPermission(permission)
          setIsEditDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch permission details:', error)
          toast.error('Failed to fetch permission details. Please try again')
        } finally {
          operationStates.setLoadingId('edit', null)
        }
        break

      case 'view':
        try {
          operationStates.setLoadingId('view', id)
          const permission = await getPermissionDetails(id)
          setViewingPermission(permission)
          setIsViewDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch permission details:', error)
          toast.error('Failed to fetch permission details. Please try again')
        } finally {
          operationStates.setLoadingId('view', null)
        }
        break

      case 'delete':
        setDeletingPermissionId(id)
        setIsDeleteDialogOpen(true)
        break
    }
  }

  // 刷新权限列表后保持已展开项的状态
  const refreshPermissionsAndKeepExpanded = async () => {
    // 保存当前展开状态
    const currentExpandedState = { ...expandedRows }

    // 在搜索模式下，先清除搜索
    if (filters.searchTerm) {
      setFilters({ searchTerm: '', type: filters.type })
    }

    // 刷新权限数据
    await refreshPermissions()

    // 恢复展开状态
    setExpandedRows(currentExpandedState)
  }

  // 获取所有权限（不使用分页）
  useEffect(() => {
    // 初始加载完成后，如果总数据量很大，重新获取所有权限
    if (permissions.length > 0 && permissions.length < pagination.total) {
      console.log('Loading all permissions without pagination')
      refreshPermissions()
    }
  }, [])

  // Handler to delete permission
  const handleDelete = async () => {
    if (!deletingPermissionId) return

    try {
      await deletePermission(deletingPermissionId)

      // Close confirmation dialog
      setIsDeleteDialogOpen(false)
      setDeletingPermissionId(null)

      // Refresh list
      await refreshPermissionsAndKeepExpanded()

      toast.success('Permission deleted successfully')
    } catch (error) {
      console.error('Failed to delete permission:', error)
      toast.error('Failed to delete permission. Please try again')
    }
  }

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    // Convert code field to uppercase
    if (name === 'code') {
      setNewPermission(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }))
    } else {
      setNewPermission(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Handle type selection change
  const handleTypeChange = (value: string) => {
    setNewPermission(prev => ({
      ...prev,
      type: value as 'system' | 'page' | 'module' | 'operation' | 'data'
    }))
  }

  // Handle parent selection change
  const handleParentChange = (value: string) => {
    setNewPermission(prev => ({
      ...prev,
      parent_id: value === 'null' ? null : parseInt(value)
    }))
  }

  // Handle edit form input change
  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editingPermission) return

    const { name, value } = e.target

    // Convert code field to uppercase
    if (name === 'code') {
      setEditingPermission(prev => ({
        ...prev!,
        [name]: value.toUpperCase()
      }))
    } else {
      setEditingPermission(prev => ({
        ...prev!,
        [name]: value
      }))
    }
  }

  // Handle edit form type selection change
  const handleEditTypeChange = (value: string) => {
    if (!editingPermission) return

    setEditingPermission(prev => ({
      ...prev!,
      type: value as 'system' | 'page' | 'module' | 'operation' | 'data'
    }))
  }

  // Handle edit form parent selection change
  const handleEditParentChange = (value: string) => {
    if (!editingPermission) return

    setEditingPermission(prev => ({
      ...prev!,
      parent_id: value === 'null' ? null : parseInt(value)
    }))
  }

  // Prepare permission selector options - 避免在渲染过程中重复计算
  const permissionOptions = useMemo(() => {
    const baseOptions = permissions.map(p => ({
      value: p.id.toString(),
      label: `${p.name} (${p.code})`
    }))

    // Add no parent option
    return [{ value: 'null', label: 'Top Level Permission' }, ...baseOptions]
  }, [permissions])

  // Get permission options with exclude logic
  const getPermissionOptions = (excludeId?: number) => {
    if (!excludeId) {
      return permissionOptions
    }

    // Filter out the excluded ID when editing
    return [
      permissionOptions[0],
      ...permissionOptions
        .slice(1)
        .filter(option => option.value !== excludeId.toString())
    ]
  }

  // Submit edit permission
  const handleEditSubmit = async () => {
    if (!editingPermission) return

    // Form validation
    if (!editingPermission.name.trim()) {
      toast.error('Please enter permission name')
      return
    }
    if (!editingPermission.code.trim()) {
      toast.error('Please enter permission code')
      return
    }

    try {
      setIsSubmitting(true)
      // Ensure code is uppercase
      const permissionToUpdate = {
        name: editingPermission.name,
        code: editingPermission.code.toUpperCase(),
        description: editingPermission.description,
        type: editingPermission.type,
        parent_id: editingPermission.parent_id
      }

      await updatePermission(editingPermission.id, permissionToUpdate)

      // Close dialog
      setIsEditDialogOpen(false)
      setEditingPermission(null)

      // Refresh permission list
      await refreshPermissionsAndKeepExpanded()

      toast.success('Permission updated successfully')
    } catch (error) {
      console.error('Failed to update permission:', error)
      toast.error('Failed to update permission. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit new permission
  const handleSubmit = async () => {
    // Form validation
    if (!newPermission.name.trim()) {
      toast.error('Please enter permission name')
      return
    }
    if (!newPermission.code.trim()) {
      toast.error('Please enter permission code')
      return
    }

    try {
      setIsSubmitting(true)
      // Ensure code is uppercase
      const permissionToCreate = {
        ...newPermission,
        code: newPermission.code.toUpperCase()
      }

      await createPermission(permissionToCreate)

      // Reset form
      setNewPermission({
        name: '',
        code: '',
        description: '',
        type: 'page',
        parent_id: null
      })

      // Close dialog
      setIsAddDialogOpen(false)

      // Refresh permission list
      await refreshPermissionsAndKeepExpanded()

      toast.success('Permission created successfully')
    } catch (error) {
      console.error('Failed to create permission:', error)
      toast.error('Failed to create permission. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Flatten tree data
  const flattenTreeData = (data: Permission[], level = 0): Permission[] => {
    return flattenTree<Permission>(data, level, {
      isExpandedFn: item => expandedRows[item.id] || false
    })
  }

  // Process table data
  const tableData = useMemo(() => {
    // 检查权限数据是否包含 children 属性
    const hasChildren = permissions.some(
      p => p.children && p.children.length > 0
    )

    // 如果有搜索或类型筛选，不使用树形结构
    if (filters.searchTerm || (filters.type && filters.type !== 'all')) {
      // Don't use tree structure in search/filter mode
      return permissions
    }

    if (!hasChildren) {
      // 使用公共方法构建树
      const treeData = buildTree<Permission>(permissions)

      return flattenTreeData(treeData)
    }

    return flattenTreeData(permissions)
  }, [permissions, expandedRows, filters.searchTerm])

  // 当搜索条件从有到无变化时，可能需要重新初始化展开状态
  useEffect(() => {
    const searchCleared = !filters.searchTerm && initialized
    const noExpandedRows = Object.keys(expandedRows).length === 0

    if (searchCleared && noExpandedRows && permissions.length > 0) {
      const initialExpandState: Record<number, boolean> = {}

      // 设置顶级节点为展开状态
      permissions.forEach(permission => {
        if (permission.children && permission.children.length > 0) {
          initialExpandState[permission.id] = true
        }
      })

      setExpandedRows(initialExpandState)
    }
  }, [filters.searchTerm, permissions, initialized])

  return (
    <>
      <CustomTable
        data={tableData}
        columns={columns}
        loading={loading}
        idField="id"
        filters={tableFilters}
        rowActions={rowActions}
        onRowAction={handleRowAction}
        header={{
          title: 'Permission Management',
          description:
            'Manage system permissions, including system, page, module, and operation level permissions',
          actions: [
            {
              icon: Plus,
              label: 'Add Permission',
              onClick: () => setIsAddDialogOpen(true),
              variant: 'default',
              tooltip: false
            }
          ]
        }}
        emptyStateMessage="No matching permissions found"
      />

      {/* Add Permission Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Permission</DialogTitle>
            <DialogDescription>
              Create a new system permission. Fill in the permission details and
              click submit to save.
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
                value={newPermission.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g. User Management"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="code"
                  name="code"
                  value={newPermission.code}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="e.g. user:manage"
                />
                <p className="text-xs text-muted-foreground">
                  Code will be automatically converted to uppercase.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Select
                  key="add-type-select"
                  name="type"
                  value={newPermission.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select permission type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="module">Module</SelectItem>
                    <SelectItem value="operation">Operation</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent" className="text-right">
                Parent
              </Label>
              <div className="col-span-3">
                <Select
                  name="parent_id"
                  key="add-parent-select"
                  value={
                    newPermission.parent_id === null
                      ? 'null'
                      : newPermission.parent_id.toString()
                  }
                  onValueChange={handleParentChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a parent to create nested permissions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={newPermission.description}
                onChange={handleInputChange}
                placeholder="Enter a detailed description of the permission..."
                className="col-span-3"
                rows={3}
              />
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

      {/* Edit Permission Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={open => {
          setIsEditDialogOpen(open)
          if (!open) setEditingPermission(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>
              Edit system permission information. Update permission details and
              click save.
            </DialogDescription>
          </DialogHeader>

          {editingPermission && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingPermission.name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">
                  Code
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="edit-code"
                    name="code"
                    value={editingPermission.code}
                    onChange={handleEditInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Code will be automatically converted to uppercase.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">
                  Type
                </Label>
                <div className="col-span-3">
                  {editingPermission && (
                    <Select
                      key="edit-type-select"
                      name="type"
                      value={editingPermission.type}
                      onValueChange={handleEditTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select permission type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="page">Page</SelectItem>
                        <SelectItem value="module">Module</SelectItem>
                        <SelectItem value="operation">Operation</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parent" className="text-right">
                  Parent
                </Label>
                <div className="col-span-3">
                  {editingPermission && (
                    <Select
                      name="parent_id"
                      value={
                        editingPermission.parent_id === null
                          ? 'null'
                          : editingPermission.parent_id.toString()
                      }
                      onValueChange={handleEditParentChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent permission" />
                      </SelectTrigger>
                      <SelectContent>
                        {getPermissionOptions(editingPermission.id).map(
                          option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Cannot select self as parent or create circular references.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={editingPermission.description}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                  rows={3}
                />
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

      {/* View Permission Details Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={open => {
          setIsViewDialogOpen(open)
          if (!open) setViewingPermission(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Permission Details</DialogTitle>
            <DialogDescription>
              View detailed information of the system permission.
            </DialogDescription>
          </DialogHeader>

          {viewingPermission && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">ID</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingPermission.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Name</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingPermission.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Code</Label>
                <div className="col-span-3">
                  <p className="text-sm font-mono">{viewingPermission.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Type</Label>
                <div className="col-span-3">
                  {getTypeBadge(viewingPermission.type)}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Parent</Label>
                <div className="col-span-3">
                  {viewingPermission.parent_id ? (
                    <div className="flex items-center space-x-1">
                      <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        ID: {viewingPermission.parent_id}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Top Level Permission
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Description</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingPermission.description || 'None'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {formatDate(viewingPermission.created_at || '')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Updated At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {formatDate(viewingPermission.updated_at || '')}
                  </p>
                </div>
              </div>

              {viewingPermission.children &&
                viewingPermission.children.length > 0 && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right font-medium">Children</Label>
                    <div className="col-span-3">
                      <div className="space-y-1 bg-muted/20 p-2 rounded-md">
                        {viewingPermission.children.map(child => (
                          <div
                            key={child.id}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span>{child.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({child.code})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
              Are you sure you want to delete this permission? This action
              cannot be undone.
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
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
