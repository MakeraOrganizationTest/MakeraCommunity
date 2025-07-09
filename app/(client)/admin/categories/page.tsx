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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Category, GetCategoriesParams } from '@/types/categories'
import { buildTree, flattenTree } from '@/lib/tree'
import {
  getCategories,
  getCategoryDetails,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/admin/categories'
export default function CategoriesPage() {
  // Add category dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState<
    Omit<Category, 'id' | 'created_at' | 'updated_at'>
  >({
    name: '',
    description: '',
    parent_id: null,
    slug: '',
    order: 0,
    is_active: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit category dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // View category details dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null)

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null
  )

  // Tree structure expansion state
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  // Use custom table hook
  const {
    data: categories,
    loading,
    pagination,
    filters,
    refresh: refreshCategories,
    setPage,
    setPageSize,
    setFilters,
    operationStates
  } = useCustomTable<Category, GetCategoriesParams>({
    fetchData: getCategories,
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

  // 当分类数据加载完成后，默认展开第一级节点
  useEffect(() => {
    if (categories && categories.length > 0 && !initialized) {
      const initialExpandState: Record<number, boolean> = {}

      // 设置顶级节点为展开状态
      categories.forEach(category => {
        if (category.children && category.children.length > 0) {
          initialExpandState[category.id] = true
        }
      })

      // 确保有状态要设置才更新
      if (Object.keys(initialExpandState).length > 0) {
        setExpandedRows(initialExpandState)
        setInitialized(true)
      }
    }
  }, [categories, initialized])

  // Expand/collapse row
  const toggleRow = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Define column configuration
  const columns: ColumnDef<Category>[] = [
    {
      key: 'name',
      header: 'Category Name',
      cell: row => {
        const hasChildren = row.children && row.children.length > 0
        const isExpanded = expandedRows[row.id] || false
        const level = row.parent_id ? 1 : 0

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
      key: 'slug',
      header: 'Slug',
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
  const rowActions: RowAction<Category>[] = [
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

  // Define filters
  const tableFilters: TableFilter[] = [
    {
      type: 'search',
      key: 'searchTerm',
      value: filters.searchTerm || '',
      placeholder: 'Search for category name, code or description...',
      onChange: value => setFilters({ searchTerm: value })
    }
  ]

  // Handle row operations
  const handleRowAction = async (
    operation: string,
    id: number,
    row: Category
  ) => {
    switch (operation) {
      case 'edit':
        try {
          operationStates.setLoadingId('edit', id)
          const category = await getCategoryDetails(id)
          setEditingCategory(category)
          setIsEditDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch category details:', error)
          toast.error('Failed to fetch category details. Please try again')
        } finally {
          operationStates.setLoadingId('edit', null)
        }
        break

      case 'view':
        try {
          operationStates.setLoadingId('view', id)
          const category = await getCategoryDetails(id)
          setViewingCategory(category)
          setIsViewDialogOpen(true)
        } catch (error) {
          console.error('Failed to fetch category details:', error)
          toast.error('Failed to fetch category details. Please try again')
        } finally {
          operationStates.setLoadingId('view', null)
        }
        break

      case 'delete':
        setDeletingCategoryId(id)
        setIsDeleteDialogOpen(true)
        break
    }
  }

  // 刷新分类列表后保持已展开项的状态
  const refreshCategoriesAndKeepExpanded = async () => {
    // 保存当前展开状态
    const currentExpandedState = { ...expandedRows }

    // 在搜索模式下，先清除搜索
    if (filters.searchTerm) {
      setFilters({ searchTerm: '', type: filters.type })
    }

    // 刷新分类数据
    await refreshCategories()

    // 恢复展开状态
    setExpandedRows(currentExpandedState)
  }

  // 获取所有分类（不使用分页）
  useEffect(() => {
    // 初始加载完成后，如果总数据量很大，重新获取所有分类
    if (categories.length > 0 && categories.length < pagination.total) {
      console.log('Loading all categories without pagination')
      refreshCategories()
    }
  }, [])

  // Handler to delete category
  const handleDelete = async () => {
    if (!deletingCategoryId) return

    try {
      await deleteCategory(deletingCategoryId)

      // Close confirmation dialog
      setIsDeleteDialogOpen(false)
      setDeletingCategoryId(null)

      // Refresh list
      await refreshCategoriesAndKeepExpanded()

      toast.success('Category deleted successfully')
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Failed to delete category. Please try again')
    }
  }

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    setNewCategory(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle parent selection change
  const handleParentChange = (value: string) => {
    setNewCategory(prev => ({
      ...prev,
      parent_id: value === 'null' ? null : parseInt(value)
    }))
  }

  // Handle order selection change
  const handleOrderChange = (value: string) => {
    setNewCategory(prev => ({
      ...prev,
      order: parseInt(value)
    }))
  }

  // Handle active change
  const handleActiveChange = (value: boolean) => {
    setNewCategory(prev => ({
      ...prev,
      is_active: value
    }))
  }

  // Handle edit form input change
  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editingCategory) return

    const { name, value } = e.target

    setEditingCategory(prev => ({
      ...prev!,
      [name]: value
    }))
  }

  // Handle edit form parent selection change
  const handleEditParentChange = (value: string) => {
    if (!editingCategory) return

    setEditingCategory(prev => ({
      ...prev!,
      parent_id: value === 'null' ? null : parseInt(value)
    }))
  }

  // Handle edit form active change
  const handleEditActiveChange = (value: boolean) => {
    if (!editingCategory) return

    setEditingCategory(prev => ({
      ...prev!,
      is_active: value
    }))
  }

  // Handle edit form order change
  const handleEditOrderChange = (value: string) => {
    if (!editingCategory) return

    setEditingCategory(prev => ({
      ...prev!,
      order: parseInt(value)
    }))
  }

  // Prepare category selector options - 避免在渲染过程中重复计算
  const categoryOptions = useMemo(() => {
    const baseOptions = categories
      .filter(p => p.parent_id === null)
      .map(p => ({
        value: p.id.toString(),
        label: `${p.name} (${p.slug})`
      }))

    // Add no parent option
    return [{ value: 'null', label: 'Top Level Category' }, ...baseOptions]
  }, [categories])

  // Get category options with exclude logic
  const getCategoryOptions = (excludeId?: number) => {
    if (!excludeId) {
      return categoryOptions
    }

    // Filter out the excluded ID when editing
    return [
      categoryOptions[0],
      ...categoryOptions
        .slice(1)
        .filter(option => option.value !== excludeId.toString())
    ]
  }

  // Submit edit category
  const handleEditSubmit = async () => {
    if (!editingCategory) return

    // Form validation
    if (!editingCategory.name.trim()) {
      toast.error('Please enter category name')
      return
    }
    if (!editingCategory.slug.trim()) {
      toast.error('Please enter category slug')
      return
    }

    try {
      setIsSubmitting(true)
      // Ensure code is uppercase
      const categoryToUpdate = {
        name: editingCategory.name,
        description: editingCategory.description,
        parent_id: editingCategory.parent_id
          ? parseInt(editingCategory.parent_id.toString())
          : null,
        order: editingCategory.order,
        is_active: editingCategory.is_active
      }

      await updateCategory(editingCategory.id, categoryToUpdate)

      // Close dialog
      setIsEditDialogOpen(false)
      setEditingCategory(null)

      // Refresh category list
      await refreshCategoriesAndKeepExpanded()

      toast.success('Category updated successfully')
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error('Failed to update category. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit new category
  const handleSubmit = async () => {
    // Form validation
    if (!newCategory.name.trim()) {
      toast.error('Please enter category name')
      return
    }
    if (!newCategory.slug.trim()) {
      toast.error('Please enter category slug')
      return
    }

    try {
      setIsSubmitting(true)
      // Ensure code is uppercase
      const categoryToCreate = {
        ...newCategory,
        slug: newCategory.slug.toLowerCase(),
        parent_id: newCategory.parent_id
          ? parseInt(newCategory.parent_id.toString())
          : null
      }

      await createCategory(categoryToCreate)

      // Reset form
      setNewCategory({
        name: '',
        description: '',
        parent_id: null,
        slug: '',
        order: 0,
        is_active: true
      })

      // Close dialog
      setIsAddDialogOpen(false)

      // Refresh category list
      await refreshCategoriesAndKeepExpanded()

      toast.success('Category created successfully')
    } catch (error) {
      console.error('Failed to create category:', error)
      toast.error('Failed to create category. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Flatten tree data
  const flattenTreeData = (data: Category[], level = 0): Category[] => {
    return flattenTree<Category>(data, level, {
      isExpandedFn: item => expandedRows[item.id] || false
    })
  }

  // Process table data
  const tableData = useMemo(() => {
    // 检查分类数据是否包含 children 属性
    const hasChildren = categories.some(
      p => p.children && p.children.length > 0
    )

    // 如果有搜索或类型筛选，不使用树形结构
    if (filters.searchTerm || (filters.type && filters.type !== 'all')) {
      // Don't use tree structure in search/filter mode
      return categories
    }

    if (!hasChildren) {
      // 使用公共方法构建树
      const treeData = buildTree<Category>(categories)

      return flattenTreeData(treeData)
    }

    return flattenTreeData(categories)
  }, [categories, expandedRows, filters.searchTerm])

  // 当搜索条件从有到无变化时，可能需要重新初始化展开状态
  useEffect(() => {
    const searchCleared = !filters.searchTerm && initialized
    const noExpandedRows = Object.keys(expandedRows).length === 0

    if (searchCleared && noExpandedRows && categories.length > 0) {
      const initialExpandState: Record<number, boolean> = {}

      // 设置顶级节点为展开状态
      categories.forEach(category => {
        if (category.children && category.children.length > 0) {
          initialExpandState[category.id] = true
        }
      })

      setExpandedRows(initialExpandState)
    }
  }, [filters.searchTerm, categories, initialized])

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
          title: 'Category Management',
          description: 'Manage system categories',
          actions: [
            {
              icon: Plus,
              label: 'Add Category',
              onClick: () => setIsAddDialogOpen(true),
              variant: 'default',
              tooltip: false
            }
          ]
        }}
        emptyStateMessage="No matching categories found"
      />

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new system category. Fill in the category details and
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
                value={newCategory.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g. User Management"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Slug
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="slug"
                  name="slug"
                  value={newCategory.slug}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="e.g. your-category-slug"
                />
                <p className="text-xs text-muted-foreground">
                  Slug will be used as the URL path.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Order
              </Label>
              <div className="col-span-3 space-y-1">
                <Select
                  name="order"
                  key="add-order-select"
                  value={newCategory.order.toString()}
                  onValueChange={handleOrderChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Order will be used to sort the category.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Active
              </Label>
              <div className="col-span-3 space-y-1">
                <Switch
                  name="is_active"
                  checked={newCategory.is_active}
                  onCheckedChange={handleActiveChange}
                />
                <p className="text-xs text-muted-foreground">
                  Active will be used to determine if the category is active.
                </p>
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
                    newCategory.parent_id === null
                      ? 'null'
                      : newCategory.parent_id?.toString()
                  }
                  onValueChange={handleParentChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a parent to create nested categories.
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
                value={newCategory.description}
                onChange={handleInputChange}
                placeholder="Enter a detailed description of the category..."
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

      {/* Edit Category Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={open => {
          setIsEditDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Edit system category information. Update category details and
              click save.
            </DialogDescription>
          </DialogHeader>

          {editingCategory && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editingCategory.name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-slug" className="text-right">
                  Slug
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="edit-slug"
                    name="slug"
                    value={editingCategory.slug}
                    onChange={handleEditInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Slug will be automatically converted to uppercase.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">
                  Order
                </Label>
                <div className="col-span-3 space-y-1">
                  <Select
                    name="order"
                    key="add-order-select"
                    value={editingCategory.order.toString()}
                    onValueChange={handleEditOrderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Order will be used to sort the category.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">
                  Active
                </Label>
                <div className="col-span-3 space-y-1">
                  <Switch
                    name="is_active"
                    checked={editingCategory.is_active}
                    onCheckedChange={handleEditActiveChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Active will be used to determine if the category is active.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parent" className="text-right">
                  Parent
                </Label>
                <div className="col-span-3">
                  {editingCategory && (
                    <Select
                      name="parent_id"
                      value={
                        editingCategory.parent_id === null
                          ? 'null'
                          : editingCategory.parent_id?.toString()
                      }
                      onValueChange={handleEditParentChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoryOptions(editingCategory.id).map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                  value={editingCategory.description}
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

      {/* View Category Details Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onOpenChange={open => {
          setIsViewDialogOpen(open)
          if (!open) setViewingCategory(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
            <DialogDescription>
              View detailed information of the system category.
            </DialogDescription>
          </DialogHeader>

          {viewingCategory && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">ID</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingCategory.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Name</Label>
                <div className="col-span-3">
                  <p className="text-sm">{viewingCategory.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Slug</Label>
                <div className="col-span-3">
                  <p className="text-sm font-mono">{viewingCategory.slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Order</Label>
                <div className="col-span-3">
                  <p className="text-sm font-mono">{viewingCategory.order}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Active</Label>
                <div className="col-span-3">
                  <p className="text-sm font-mono">
                    {viewingCategory.is_active ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Parent</Label>
                <div className="col-span-3">
                  {viewingCategory.parent_id ? (
                    <div className="flex items-center space-x-1">
                      <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        ID: {viewingCategory.parent_id}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Top Level Category
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Description</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {viewingCategory.description || 'None'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Created At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {formatDate(viewingCategory.created_at || '')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Updated At</Label>
                <div className="col-span-3">
                  <p className="text-sm">
                    {formatDate(viewingCategory.updated_at || '')}
                  </p>
                </div>
              </div>

              {viewingCategory.children &&
                viewingCategory.children.length > 0 && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right font-medium">Children</Label>
                    <div className="col-span-3">
                      <div className="space-y-1 bg-muted/20 p-2 rounded-md">
                        {viewingCategory.children.map(child => (
                          <div
                            key={child.id}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span>{child.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({child.slug})
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
              Are you sure you want to delete this category? This action cannot
              be undone.
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
