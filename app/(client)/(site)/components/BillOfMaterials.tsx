import {
  MIconMachine,
  MIconBlank,
  MIconKnife,
  MIconTool,
  MIconNote
} from '@/components/icons'
import { Tooltip } from 'antd'
import { memo } from 'react'

// 定义数据类型
interface BillOfMaterialsItem {
  name: string
  id?: string | number
  remark?: string
}

interface BillOfMaterialsProps {
  machineData?: BillOfMaterialsItem[]
  blankData?: BillOfMaterialsItem[]
  knifeData?: BillOfMaterialsItem[]
  otherData?: BillOfMaterialsItem[]
  showDivider?: boolean
  className?: string
}

export type { BillOfMaterialsItem, BillOfMaterialsProps }

// 图标映射
const iconMap = {
  machine: MIconMachine,
  blank: MIconBlank,
  knife: MIconKnife,
  other: MIconTool
}

// 标题映射
const titleMap = {
  machine: 'Machines Used',
  blank: 'Blank',
  knife: 'Knives',
  other: 'Other'
}

// 单个材料项组件
const BillOfMaterialsSection = memo(
  ({
    type,
    data,
    showDivider,
    isLastItem
  }: {
    type: 'machine' | 'blank' | 'knife' | 'other'
    data: BillOfMaterialsItem[]
    showDivider: boolean
    isLastItem: boolean
  }) => {
    const IconComponent = iconMap[type]
    const title = titleMap[type]

    // 如果没有数据，不渲染
    if (!data || data.length === 0) {
      return null
    }

    return (
      <div
        className={`w-full py-3 ${showDivider && !isLastItem ? 'border-b-[2px] border-b-border py-6' : ''}`}
      >
        <div className="flex w-full items-center gap-2">
          <IconComponent className="text-[16px] text-text-primary" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="mt-[12px] flex w-full flex-wrap gap-3">
          {data.map((item, dataIndex) =>
            type === 'other' ? (
              <div
                key={dataIndex}
                className="flex w-auto items-center gap-[2px] px-2 py-[2px] text-sm font-medium text-text-muted"
              >
                <span>{item?.name}</span>
                {item?.remark && (
                  <Tooltip placement="top" title={item?.remark}>
                    <MIconNote className="cursor-pointer text-[16px] hover:text-text-primary" />
                  </Tooltip>
                )}
              </div>
            ) : (
              <div
                key={dataIndex}
                className="box-border w-auto rounded-[4px] border border-border px-2 py-[2px] text-sm font-medium"
              >
                {item?.name}
              </div>
            )
          )}
        </div>
      </div>
    )
  }
)

BillOfMaterialsSection.displayName = 'BillOfMaterialsSection'

export default function BillOfMaterials({
  machineData = [],
  blankData = [],
  knifeData = [],
  otherData = [],
  showDivider = false,
  className = ''
}: BillOfMaterialsProps) {
  // 定义所有可能的数据项
  const sections = [
    { type: 'machine' as const, data: machineData },
    { type: 'blank' as const, data: blankData },
    { type: 'knife' as const, data: knifeData },
    { type: 'other' as const, data: otherData }
  ]

  // 过滤掉没有数据的部分
  const activeSections = sections.filter(section => section.data.length > 0)

  return (
    <div className={`${className}`}>
      {activeSections.map((section, index) => (
        <BillOfMaterialsSection
          key={section.type}
          type={section.type}
          data={section.data}
          showDivider={showDivider}
          isLastItem={index === activeSections.length - 1}
        />
      ))}
    </div>
  )
}
