'use client'

import { Collapse, Button, Dropdown, Popover, Tooltip } from 'antd'
import type { CollapseProps } from 'antd'
import { useState } from 'react'
import {
  MIconArrowRight,
  MIconDownload,
  MIcon3DModel,
  MIconDoubleTop,
  MIconTime
} from '@/components/icons'
import { getImageLink } from '@/lib/link'
import { ProjectFile } from '@/types/project'
import { formatSmartDateTime } from '@/lib/format'
import BillOfMaterials, {
  BillOfMaterialsItem
} from '../../../components/BillOfMaterials'

interface FileCollapseProps {
  files: ProjectFile[]
}

export default function FileCollapse({ files }: FileCollapseProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 在 Client Component 中处理菜单点击事件
  const menuProps = {
    items: [
      {
        label: '1st menu item',
        key: '1'
      },
      {
        label: '2nd menu item',
        key: '2'
      }
    ],
    onClick: () => {
      console.log('Download menu clicked')
      // 这里可以添加实际的下载逻辑
    }
  }

  // 决定显示的文件数量
  const displayFiles =
    files.length > 2 && !isExpanded ? files.slice(0, 2) : files

  // 是否显示展开/收起按钮
  const showToggleButton = files.length > 2

  const getfileContent = (file: ProjectFile) => {
    // 从 cutters 二维数组中提取每个数组的最后一项
    const knifeData: BillOfMaterialsItem[] = []
    if (file.cutters && Array.isArray(file.cutters)) {
      file.cutters.forEach(cutterGroup => {
        if (Array.isArray(cutterGroup) && cutterGroup.length > 0) {
          const lastItem = cutterGroup[cutterGroup.length - 1]
          if (lastItem && lastItem.name) {
            knifeData.push({
              name: lastItem.name,
              id: lastItem.id
            })
          }
        }
      })
    }

    // 确保 blank 数据符合类型要求
    const blankData: BillOfMaterialsItem[] = []
    if (file.blank && Array.isArray(file.blank)) {
      file.blank.forEach(item => {
        if (item && item.name) {
          blankData.push({
            name: item.name,
            id: item.id
          })
        }
      })
    }

    // 直接使用分离的数据数组以优化性能
    return (
      <div className="relative box-border w-[420px] p-2">
        <div className="flex items-center gap-3">
          <div className="relative h-[75px] w-[100px] overflow-hidden rounded-[8px]">
            <img
              src={getImageLink(file.thumbnail) ?? ''}
              alt={file.name}
              className="h-full w-full object-cover"
            />
            <div
              className="absolute bottom-0 left-0 flex cursor-pointer items-center gap-[2px] rounded-tr-[8px] bg-black/50 px-1 py-[1px] text-white"
              title="View Model"
            >
              <MIcon3DModel className="text-[16px]" />
              <span className="text-[14px] font-medium">3D</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="text-sm font-semibold text-text-primary">
              {`${file.name}.${file.file_type}`}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MIconDownload className="text-[12px]" />
                <span className="">{file?.downloads || 0}</span>
              </div>
              <Tooltip
                placement="top"
                title={`Last Updated: ${formatSmartDateTime(file?.updated_at)}`}
              >
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MIconTime className="text-[14px]" />
                  <span className="">
                    {formatSmartDateTime(file?.created_at)}
                  </span>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="mt-4 h-[1px] w-full bg-border"></div>

        <div className="mt-1 w-full">
          <BillOfMaterials blankData={blankData} knifeData={knifeData} />
        </div>

        <div className="right-0 box-border pt-4">
          <Button
            color="primary"
            variant="filled"
            block
            className="w-full"
            icon={<MIconDownload className="" />}
          >
            Download
          </Button>
        </div>
      </div>
    )
  }

  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: `CAM File (${files.length})`,
      styles: {
        body: {
          paddingTop: '0px',
          paddingBottom: '0px'
        },
        header: {
          fontSize: '14px',
          fontWeight: '600',
          color: 'hsl(var(--color-text-primary))',
          paddingTop: '22px',
          paddingBottom: '22px'
        }
      },
      children: (
        <div className="mb-4 flex w-full flex-col gap-3">
          {displayFiles.map(file => (
            <Popover
              key={file.id}
              placement="left"
              content={getfileContent(file)}
            >
              <div
                key={file.id}
                className="flex cursor-pointer items-center gap-3 rounded-[12px] bg-background p-3 dark:bg-card"
              >
                <div className="relative h-[54px] w-[72px] overflow-hidden rounded-[8px]">
                  <img
                    src={getImageLink(file.thumbnail) ?? ''}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="absolute bottom-0 left-0 cursor-pointer rounded-tr-[8px] bg-black/50 px-1 py-0.5"
                    title="View Model"
                  >
                    <MIcon3DModel className="text-[16px] text-white" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="text-sm font-semibold text-text-primary">
                    {`${file.name}.${file.file_type}`}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MIconDownload className="" />
                    <span className="">{file?.downloads || 0}</span>
                  </div>
                </div>
              </div>
            </Popover>
          ))}

          {showToggleButton && (
            <Button
              type="dashed"
              block
              className="w-full text-text-tertiary!"
              icon={
                <MIconDoubleTop
                  className={`text-[8px] text-text-tertiary ${isExpanded ? '' : 'rotate-180'}`}
                />
              }
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Close' : 'Expand'}
            </Button>
          )}

          <Dropdown.Button
            className="w-full"
            type="primary"
            menu={menuProps}
            icon={<MIconArrowRight className="rotate-90" />}
          >
            <MIconDownload />
            Download All
          </Dropdown.Button>
        </div>
      )
    }
  ]

  return (
    <Collapse
      ghost
      className="box-border border! border-border!"
      bordered={false}
      defaultActiveKey={['1']}
      expandIconPosition={'end'}
      expandIcon={({ isActive }) => (
        <MIconArrowRight
          className={`origin-center! text-[18px]! transition-transform! duration-150! ${isActive ? '-rotate-90' : 'rotate-90'}`}
        />
      )}
      items={items}
    />
  )
}
