'use client'

import { Collapse, Alert } from 'antd'
import type { CollapseProps } from 'antd'
import {
  MIconArrowRight,
  MIconWuxian,
  MIconCopy,
  MIconCheck
} from '@/components/icons'
import LicenseCard from './LicenseCard'
import { useState } from 'react'

export default function BaseCollapse({}) {
  // 在 Client Component 中处理菜单点击事件
  const [isCopied, setIsCopied] = useState(false)

  const templateUrl =
    'https://www.atomm.com/template/54595abbbad/asdu23asdasd/asdasdsdasd'

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(templateUrl)
      setIsCopied(true)
      // 1秒后恢复为复制图标
      setTimeout(() => {
        setIsCopied(false)
      }, 1000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const items: CollapseProps['items'] = [
    {
      key: '1',
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
      label: (
        <div className="flex items-center gap-1">
          <MIconWuxian className="text-[20px] text-text-muted" />
          <span>Based on the following model</span>
        </div>
      ),
      children: (
        <div className="mb-4 flex w-full flex-col gap-3">
          <div className="flex w-full items-center gap-1">
            <div className="line-clamp-1 w-[calc(100%-24px)] truncate overflow-hidden text-[12px] leading-4.5 font-medium text-text-muted">
              {templateUrl}
            </div>
            <div
              className="flex h-[20px] w-[20px] cursor-pointer items-center justify-center text-text-muted transition-colors hover:text-text-primary"
              onClick={handleCopyUrl}
            >
              {isCopied ? (
                <MIconCheck className="text-[14px] text-green-500" />
              ) : (
                <MIconCopy className="text-[14px]" />
              )}
            </div>
          </div>

          <LicenseCard />

          <Alert
            className="border-primary-1/60! px-[12px]! py-[16px]! align-text-top! leading-[1.5]!"
            description="This work is a secondary creation published before the original author changed the license"
            type="info"
            closable
            showIcon
          />
        </div>
      )
    }
  ]

  return (
    <Collapse
      ghost
      className="box-border border! border-border!"
      bordered={false}
      defaultActiveKey={[]}
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
