'use client'

import { Button, Dropdown, MenuProps } from 'antd'
import { useEffect } from 'react'
import {
  MIconLike,
  MIconLikeFill,
  MIconCollect,
  MIconComment,
  MIconShare,
  MIconDiscord,
  MIconFacebook,
  MIconTwitter,
  MIconReddit,
  MIconInstagram,
  MIconTelegram,
  MIconCopyLink
} from '@/components/icons'
import { formatCompactNumber } from '@/lib/format'
import { Project } from '@/types/project'
import { useModel } from '../hooks/model'

export default function InteractiveButton({ data }: { data: Project }) {
  const {
    setTabActiveKeyAndScroll,
    isLiked,
    likesCount,
    isLiking,
    setProjectLikeData,
    toggleLike,
    projectId
  } = useModel()

  // 组件加载时设置初始点赞数据
  useEffect(() => {
    if (data) {
      // 使用从API返回的点赞状态，如果没有则默认为false
      setProjectLikeData(data.is_liked || false, data.likes_count)
    }
  }, [data, setProjectLikeData])

  // 处理点赞点击
  const handleLikeClick = async () => {
    if (projectId) {
      await toggleLike(projectId)
    }
  }

  const shareItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className="flex h-[28px] items-center gap-2 text-sm">
          <MIconDiscord className="text-xl" />
          <span className="font-semibold">Discord</span>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <div className="flex h-[28px] items-center gap-2 text-sm">
          <MIconFacebook className="text-xl" />
          <span className="font-semibold">Facebook</span>
        </div>
      )
    },
    {
      key: '3',
      label: (
        <div className="flex h-[28px] items-center gap-2 text-sm">
          <MIconTwitter className="text-xl" />
          <span className="font-semibold">Twitter</span>
        </div>
      )
    },
    {
      key: '4',
      label: (
        <div className="flex h-[28px] items-center gap-2 text-sm">
          <MIconReddit className="text-xl" />
          <span className="font-semibold">Reddit</span>
        </div>
      )
    },
    {
      key: '5',
      label: (
        <div className="flex h-[28px] items-center gap-2 text-sm">
          <MIconInstagram className="text-xl" />
          <span className="font-semibold">Instagram</span>
        </div>
      )
    },
    {
      key: '6',
      label: (
        <div className="flex h-[28px] items-center gap-2 text-sm">
          <MIconTelegram className="text-xl" />
          <span className="font-semibold">Telegram</span>
        </div>
      )
    },
    {
      key: '7',
      label: (
        <div className="flex h-[28px] items-center gap-2 text-sm">
          <MIconCopyLink className="text-xl" />
          <span className="font-semibold">Copy Link</span>
        </div>
      )
    }
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      <Button
        className={`flex h-[60px]! items-center justify-center gap-1 rounded-[12px]! border px-0 transition-colors ${
          isLiked
            ? 'border-secondary bg-secondary/10 hover:bg-secondary/20'
            : 'border-border hover:bg-gray-50'
        }`}
        onClick={handleLikeClick}
        disabled={isLiking}
      >
        {isLiked ? (
          <MIconLikeFill className="text-[18px] text-secondary" />
        ) : (
          <MIconLike className="text-[18px] text-text-primary" />
        )}
        <span
          className={`text-sm font-medium ${isLiked ? 'text-secondary' : 'text-text-primary'}`}
        >
          {formatCompactNumber(likesCount)}
        </span>
      </Button>

      <Button className="flex h-[60px]! items-center justify-center gap-1 rounded-[12px]! border border-border px-0">
        <MIconCollect className="text-[18px] text-text-primary" />
        {/* <MIconCollectFill className="text-[18px] text-primary" /> */}
        <span className="text-sm font-medium text-text-primary">
          {formatCompactNumber(data.favorites_count)}
        </span>
      </Button>

      <Button
        className="flex h-[60px]! items-center justify-center gap-1 rounded-[12px]! border border-border px-0"
        onClick={() => setTabActiveKeyAndScroll('3')}
      >
        <MIconComment className="text-[18px] text-text-primary" />
        <span className="text-sm font-medium text-text-primary">
          {formatCompactNumber(data.comments_count)}
        </span>
      </Button>

      <Dropdown menu={{ items: shareItems }} placement="bottomRight">
        <Button className="flex h-[60px]! items-center justify-center gap-1 rounded-[12px]! border border-border px-0">
          <MIconShare className="text-[18px] text-text-primary" />
          <span className="text-sm font-medium text-text-primary">
            {formatCompactNumber(data.shares_count)}
          </span>
        </Button>
      </Dropdown>
    </div>
  )
}
