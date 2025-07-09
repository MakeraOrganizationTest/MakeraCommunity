import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TreeOption {
  id: number
  name: string
  code?: string
  description?: string
  children?: TreeOption[]
}

interface CheckboxTreeProps {
  options: TreeOption[]
  selectedValues: number[]
  onChange: (selectedValues: number[]) => void
  maxHeight?: string
}

export function CheckboxTree({
  options,
  selectedValues,
  onChange,
  maxHeight = '300px'
}: CheckboxTreeProps) {
  // 展开/折叠状态
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>(
    {}
  )

  // 初始化根节点展开
  useState(() => {
    const initialExpandState: Record<number, boolean> = {}
    options.forEach(option => {
      if (option.children && option.children.length > 0) {
        initialExpandState[option.id] = true
      }
    })
    setExpandedNodes(initialExpandState)
  })

  // 切换节点展开状态
  const toggleNode = (value: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [value]: !prev[value]
    }))
  }

  // 处理复选框选择
  const handleCheckboxChange = (value: number, checked: boolean) => {
    // 获取当前节点及其所有子节点的值
    const getAllChildValues = (option: TreeOption): number[] => {
      let values = [option.id]
      if (option.children && option.children.length > 0) {
        option.children.forEach(child => {
          values = [...values, ...getAllChildValues(child)]
        })
      }
      return values
    }

    // 查找选项
    const findOption = (
      options: TreeOption[],
      value: number
    ): TreeOption | null => {
      for (const option of options) {
        if (option.id === value) {
          return option
        }
        if (option.children && option.children.length > 0) {
          const found = findOption(option.children, value)
          if (found) return found
        }
      }
      return null
    }

    let newSelected = [...selectedValues]

    if (checked) {
      // 添加当前节点及其所有子节点
      const option = findOption(options, value)
      if (option) {
        const allValues = getAllChildValues(option)
        // 过滤掉已经存在的值，避免重复
        const valuesToAdd = allValues.filter(v => !newSelected.includes(v))
        newSelected = [...newSelected, ...valuesToAdd]
      }
    } else {
      // 移除当前节点及其所有子节点
      const option = findOption(options, value)
      if (option) {
        const allValues = getAllChildValues(option)
        newSelected = newSelected.filter(v => !allValues.includes(v))
      }
    }

    onChange(newSelected)
  }

  // 递归渲染树节点
  const renderTreeNode = (option: TreeOption, level = 0) => {
    const hasChildren = option.children && option.children.length > 0
    const isExpanded = expandedNodes[option.id] || false
    const isSelected = selectedValues.includes(option.id)

    // 检查是否所有子节点都被选中
    const allChildrenSelected =
      hasChildren &&
      option.children!.every(child => selectedValues.includes(child.id))

    // 检查是否有部分子节点被选中
    const someChildrenSelected =
      hasChildren &&
      option.children!.some(child => selectedValues.includes(child.id))

    // 计算当前节点的状态
    const checked = isSelected || allChildrenSelected
    const indeterminate = !checked && someChildrenSelected

    return (
      <div key={option.id} className="space-y-1">
        <div className="flex items-start space-x-2">
          <div
            style={{ marginLeft: `${level * 20}px` }}
            className="flex items-center space-x-2"
          >
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={() => toggleNode(option.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-5"></div>}
            <Checkbox
              id={`checkbox-${option.id}`}
              checked={checked}
              onCheckedChange={checked =>
                handleCheckboxChange(option.id, checked as boolean)
              }
              className={
                indeterminate ? 'data-[state=indeterminate]:bg-primary/80' : ''
              }
              data-state={indeterminate ? 'indeterminate' : undefined}
            />
            <div className="grid gap-1 leading-none">
              <Label
                htmlFor={`checkbox-${option.id}`}
                className={`text-sm ${
                  level === 0 ? 'font-medium' : ''
                } leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`}
              >
                {option.name}
              </Label>
              {option.code && (
                <p className="text-xs text-muted-foreground">{option.code}</p>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {option.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="border rounded-md p-4 w-full overflow-auto"
      style={{ maxHeight }}
    >
      <div className="space-y-4">
        {options.map(option => renderTreeNode(option))}
      </div>
    </div>
  )
}
