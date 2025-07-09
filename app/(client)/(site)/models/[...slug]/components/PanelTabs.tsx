'use client'

import { Affix, Tabs, TabsProps } from 'antd'
import { useModel } from '../hooks/model'
import { useEffect, useRef, useMemo, useState } from 'react'

export default function PanelTabs({ items }: { items: TabsProps['items'] }) {
  const { tabActiveKey, shouldScrollToTop, setTabActiveKey, resetScrollFlag } =
    useModel()
  const tabsRef = useRef<HTMLDivElement>(null)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(
    new Set([tabActiveKey])
  )

  // 使用 useMemo 优化性能，避免每次渲染都重新创建对象
  const tabContentMap = useMemo(() => {
    const obj: Record<string, React.ReactNode> = {}
    items?.forEach(item => {
      if (item.key) {
        obj[item.key] = item.children as React.ReactNode
        item.children = null
      }
    })
    return obj
  }, [items])

  // 监听shouldScrollToTop变化，需要时滚动到顶部
  useEffect(() => {
    if (shouldScrollToTop && tabsRef.current) {
      // 给tabs切换一些时间，然后再滚动
      setTimeout(() => {
        if (tabsRef.current) {
          tabsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
        // 滚动后重置标志
        resetScrollFlag()
      }, 100) // 延迟100ms确保tabs切换完成
    }
  }, [shouldScrollToTop, resetScrollFlag])

  useEffect(() => {
    if (tabActiveKey) {
      setLoadedTabs(prev => new Set([...prev, tabActiveKey]))
    }
  }, [tabActiveKey])

  // 渲染 tab 内容，添加错误处理和懒加载
  const renderTabContent = (key: string) => {
    return tabContentMap[key] || null
  }

  // 处理 tab 切换
  const handleTabChange = (key: string) => {
    setTabActiveKey(key)
    // 可以在这里添加更多的切换逻辑
  }

  return (
    <div className="model-panel w-full">
      <Affix offsetTop={60}>
        <div ref={tabsRef} className="w-full bg-card">
          <Tabs
            activeKey={tabActiveKey}
            onChange={handleTabChange}
            centered
            items={items}
            size="small"
          />
        </div>
      </Affix>

      <div className="tab-content-container transition-all duration-300 ease-in-out">
        {renderTabContent(tabActiveKey)}
      </div>
    </div>
  )
}
