import MCarousel from '@/components/makeraui/carousel'
import PanelTabs from './components/PanelTabs'
import FileCollapse from './components/FileCollapse'
import BaseCollapse from './components/BaseCollapse'
import Description from './components/Description'
import InteractiveButton from './components/InteractiveButton'
import BillOfMaterials, {
  type BillOfMaterialsItem
} from '../../components/BillOfMaterials'
import Comments from './components/Comments'
import { Button, Avatar, Tag, Tabs, Dropdown, Tooltip } from 'antd'
import {
  MIconArrowRight,
  MIconTime,
  MIconDownload,
  MIconEye,
  MIconMore,
  MIconReport
} from '@/components/icons'
import type { MenuProps, TabsProps } from 'antd'
import { getProjectInfo } from '@/api/client/project'
import { notFound } from 'next/navigation'
import { getImageLink } from '@/lib/link'
import { formatCompactNumber, formatSmartDateTime } from '@/lib/format'
import { cookies } from 'next/headers'

export default async function Page({
  params
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  console.log('URL slug:', slug)

  const cookieStore = await cookies()
  const authCookies = cookieStore.toString()

  // 从 slug 数组中提取项目 ID
  // 假设项目 ID 是 slug 数组的第一个元素
  const projectId = slug[0]

  if (!projectId) {
    notFound()
  }

  // 调用接口获取项目详情
  let displayData
  try {
    const response = await getProjectInfo(projectId, {
      headers: {
        Cookie: authCookies
      }
    })

    if (!response.success || !response.data) {
      console.error('Failed to obtain project details:', response.message)
      notFound()
    }

    displayData = response.data

    // 确保必要字段存在，如果接口数据结构与模拟数据不同，这里需要进行数据转换
    if (!displayData.gallery || !Array.isArray(displayData.gallery))
      displayData.gallery = []

    if (!displayData.files || !Array.isArray(displayData.files))
      displayData.files = []

    console.log(111, displayData)
  } catch (error) {
    console.error('Error occurred while obtaining project details:', error)
    notFound()
  }

  // 如果没有数据，返回 404
  if (!displayData) {
    notFound()
  }

  // 材料清单数据 - 拆分为4个独立数组以优化性能
  const machineData: BillOfMaterialsItem[] = [
    {
      name: 'Carvera'
    }
  ]

  const blankData: BillOfMaterialsItem[] = [
    {
      name: 'Aluminum · 150mm×150mm×2mm'
    }
  ]

  const knifeData: BillOfMaterialsItem[] = [
    {
      name: '3.175×12mm'
    },
    {
      name: '30×0.2mm'
    },
    {
      name: '60×0.1mm'
    },
    {
      name: '3.5×12mm'
    }
  ]

  const otherData: BillOfMaterialsItem[] = [
    {
      name: 'The Invincible Diamond Drill',
      remark: 'https://www.xxxxx.xxx/xxxx/xxxx/xxx'
    }
  ]

  const tabs: TabsProps['items'] = [
    {
      label: 'Description',
      key: '1',
      children: (
        <div className="m-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20 xl:px-[120px]">
          <Description />
        </div>
      )
    },
    {
      label: 'Bill Of Materials',
      key: '2',
      children: (
        <div className="m-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20 xl:px-[120px]">
          <BillOfMaterials
            className="mt-[20px] box-border max-w-[1200px] rounded-[12px] border border-border bg-background/10 px-6"
            machineData={machineData}
            blankData={blankData}
            knifeData={knifeData}
            otherData={otherData}
            showDivider
          />
        </div>
      )
    },
    {
      label: 'Comments',
      key: '3',
      children: (
        <div className="m-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20 xl:px-[120px]">
          <Comments id={projectId} author={displayData.creator} />
        </div>
      )
    }
  ]

  const moreItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className="flex items-center gap-1 text-sm">
          <MIconReport />
          <span className="font-semibold">Report</span>
        </div>
      )
    }
  ]

  return (
    <div className="w-full bg-card py-[40px] dark:bg-background">
      <div className="mx-auto box-border w-full max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-20 xl:px-[120px]">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-9 xl:grid-cols-5">
          <div className="w-full md:col-span-5 xl:col-span-3">
            <MCarousel
              items={
                displayData.gallery
                  .map(v => getImageLink(v))
                  .filter(v => v) as string[]
              }
            />
          </div>

          {/* 右侧详情区域 */}
          <div className="flex w-full flex-col gap-4 md:col-span-4 xl:col-span-2">
            {/* 标题和标签区域 */}
            <div className="flex flex-col gap-3">
              {/* 标签和收藏按钮 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {displayData.categories.map((category, index) => (
                    <div key={category.id} className="flex items-center gap-1">
                      <Tag className="mr-0! rounded-[4px]! border-0! bg-background! px-[6px]! py-1! text-xs font-medium text-secondary">
                        {category.name}
                      </Tag>
                      {index < displayData.categories.length - 1 && (
                        <MIconArrowRight className="text-xl text-input" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 标题 */}
              <h1 className="line-clamp-2 w-full text-[28px] leading-[32px] font-semibold tracking-[0em]">
                {displayData.name}
              </h1>

              {/* 用户信息和发布时间 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar size={24} src={displayData.creator.picture} />
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <span>{displayData.creator.nick_name}</span>
                    <span className="text-text-muted">·</span>
                    <Button
                      type="link"
                      size="small"
                      className="h-auto p-0! font-semibold text-primary"
                    >
                      Follow
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted xl:gap-4">
                  <Tooltip
                    placement="top"
                    title={`Last Updated: ${formatSmartDateTime(displayData?.updated_at)}`}
                  >
                    <div className="flex items-center gap-[2px]">
                      <MIconTime className="text-xs" />
                      <span>{formatSmartDateTime(displayData.created_at)}</span>
                    </div>
                  </Tooltip>

                  <div className="flex items-center gap-[2px]">
                    <MIconEye className="text-xs" />
                    <span>{formatCompactNumber(displayData.views_count)}</span>
                  </div>
                  <div className="flex items-center gap-[2px]">
                    <MIconDownload className="text-xs" />
                    <span>
                      {formatCompactNumber(displayData.downloads_count)}
                    </span>
                  </div>
                  <Dropdown menu={{ items: moreItems }} placement="bottomRight">
                    <div className="flex h-[14px] w-[14px] cursor-pointer items-center justify-center text-text-muted">
                      <MIconMore />
                    </div>
                  </Dropdown>
                </div>
              </div>
            </div>

            {/* CAM 文件区域 */}
            <FileCollapse files={displayData.files} />

            {/* 基于模型区域 */}
            <BaseCollapse />

            {/* 互动按钮区域 */}
            <InteractiveButton data={displayData} />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-[60px] w-full">
        <PanelTabs items={tabs} />
      </div>
    </div>
  )
}
