'use client'

import { useParams } from 'next/navigation'
import { create } from 'zustand'
import { toggleProjectLike } from '@/api/client/project'

// 定义 store 的类型
interface ModelStore {
  tabActiveKey: string
  shouldScrollToTop: boolean
  lastRefreshTime: number
  // 点赞相关状态
  isLiked: boolean
  likesCount: number
  isLiking: boolean
  // 原有方法
  setTabActiveKey: (key: string) => void
  setTabActiveKeyAndScroll: (key: string) => void
  resetScrollFlag: () => void
  refreshTabContent: () => void
  // 点赞相关方法
  setProjectLikeData: (isLiked: boolean, likesCount: number) => void
  toggleLike: (projectId: string) => Promise<void>
}

// 创建 Zustand store
export const useModelStore = create<ModelStore>((set, get) => ({
  tabActiveKey: '2',
  shouldScrollToTop: false,
  lastRefreshTime: Date.now(),
  // 点赞相关状态初始值
  isLiked: false,
  likesCount: 0,
  isLiking: false,
  // 原有方法
  setTabActiveKey: key => set({ tabActiveKey: key }),
  setTabActiveKeyAndScroll: key =>
    set({ tabActiveKey: key, shouldScrollToTop: true }),
  resetScrollFlag: () => set({ shouldScrollToTop: false }),
  refreshTabContent: () => set({ lastRefreshTime: Date.now() }),
  // 点赞相关方法
  setProjectLikeData: (isLiked: boolean, likesCount: number) =>
    set({ isLiked, likesCount }),
  toggleLike: async (projectId: string) => {
    const { isLiking, isLiked, likesCount } = get()
    if (isLiking) return // 防止重复点击

    // 保存当前状态用于回滚
    const originalIsLiked = isLiked
    const originalLikesCount = likesCount

    // 乐观更新：立即更新UI状态
    const newIsLiked = !originalIsLiked
    const newLikesCount = originalIsLiked
      ? originalLikesCount - 1
      : originalLikesCount + 1

    set({
      isLiking: true,
      isLiked: newIsLiked,
      likesCount: newLikesCount
    })

    try {
      const response = await toggleProjectLike(projectId)
      if (response.success && response.data) {
        // API 成功，使用服务器返回的准确数据
        const { liked, like_count } = response.data
        set({
          isLiked: liked,
          likesCount: like_count,
          isLiking: false
        })
      } else {
        // API 返回失败，回滚到原始状态
        set({
          isLiked: originalIsLiked,
          likesCount: originalLikesCount,
          isLiking: false
        })
      }
    } catch (error) {
      console.error('Toggle like failed:', error)
      // API 请求失败，回滚到原始状态
      set({
        isLiked: originalIsLiked,
        likesCount: originalLikesCount,
        isLiking: false
      })
    }
  }
}))

export function useModel() {
  const { slug } = useParams()
  const projectId = slug?.[0]

  // 从 store 获取状态和更新函数
  const {
    tabActiveKey,
    shouldScrollToTop,
    lastRefreshTime,
    isLiked,
    likesCount,
    isLiking,
    setTabActiveKey,
    setTabActiveKeyAndScroll,
    resetScrollFlag,
    refreshTabContent,
    setProjectLikeData,
    toggleLike
  } = useModelStore()

  return {
    projectId,
    tabActiveKey,
    shouldScrollToTop,
    lastRefreshTime,
    isLiked,
    likesCount,
    isLiking,
    setTabActiveKey,
    setTabActiveKeyAndScroll,
    resetScrollFlag,
    refreshTabContent,
    setProjectLikeData,
    toggleLike
  }
}
