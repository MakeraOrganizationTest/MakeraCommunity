import { useState, useCallback, useEffect } from 'react'
import { App } from 'antd'
import {
  getProjectComments,
  createProjectComment,
  updateProjectComment,
  deleteProjectComment,
  toggleCommentLike
} from '@/api/client/project'
import { uploadFileWithPresigned } from '@/api/client/upload'
import { getImageLink } from '@/lib/link'
import type {
  ProjectComment,
  ProjectCommentParams,
  CreateProjectCommentParams,
  UpdateProjectCommentParams
} from '@/types/comment'

// 分页状态接口
interface PaginationState {
  page: number
  limit: number
  total: number
  has_next: boolean
}

// 上传图片状态接口
interface UploadedImage {
  uid: string
  url: string
  key: string
  fileName: string
  status: 'uploading' | 'done' | 'error'
  progress: number
}

// 单个评论输入状态接口
interface CommentInputState {
  content: string
  images: UploadedImage[]
  expanded: boolean
}

// Hook 返回类型
interface UseCommentReturn {
  // 评论列表相关
  comments: ProjectComment[]
  loading: boolean
  pagination: PaginationState
  sortType: 'hot' | 'new'

  // 回复状态
  activeReplyId: string | null

  // 方法
  fetchComments: (
    sort?: 'hot' | 'new',
    page?: number,
    append?: boolean
  ) => Promise<void>
  setSortType: (sort: 'hot' | 'new') => void
  loadMoreComments: () => void

  // 评论操作
  createComment: (
    params: Omit<CreateProjectCommentParams, 'project_id'>,
    commentId?: string
  ) => Promise<void>
  updateComment: (
    id: string,
    params: Omit<UpdateProjectCommentParams, 'id'>
  ) => Promise<void>
  deleteComment: (id: string) => Promise<void>

  // 回复操作
  toggleReply: (commentId: string) => void
  loadMoreReplies: (commentId: string) => Promise<void>

  // 点赞操作
  toggleLike: (commentId: string) => Promise<void>

  // 评论输入状态管理
  getCommentState: (commentId?: string) => CommentInputState
  updateCommentContent: (content: string, commentId?: string) => void
  setCommentExpanded: (expanded: boolean, commentId?: string) => void
  uploadImage: (file: File, commentId?: string) => Promise<void>
  deleteImage: (uid: string, commentId?: string) => void
  clearCommentState: (commentId?: string) => void
}

/**
 * 评论系统 Hook
 * @param projectId 项目ID
 * @returns 评论系统相关状态和方法
 */
export function useComment(projectId: string): UseCommentReturn {
  const { message } = App.useApp()

  // 评论列表状态
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [loading, setLoading] = useState(true)
  const [sortType, setSortTypeState] = useState<'hot' | 'new'>('new')
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    has_next: false
  })

  // 回复状态
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)

  // 评论输入状态
  const [commentInputs, setCommentInputs] = useState<
    Record<string, CommentInputState>
  >({})

  // 获取评论数据
  const fetchComments = useCallback(
    async (
      sort: 'hot' | 'new' = sortType,
      page: number = 1,
      append: boolean = false
    ) => {
      try {
        if (!append) {
          setLoading(true)
        }

        const params: ProjectCommentParams = {
          project_id: projectId,
          sort,
          page,
          limit: 10 // 固定每页10条
        }

        const response = await getProjectComments(params)

        if (response.success && response.data) {
          console.log('response.data', response.data)
          if (append) {
            setComments(prev => [...prev, ...response.data!.comments])
          } else {
            setComments(response.data!.comments)
          }
          setPagination(response.data!.pagination)
        } else {
          message.error(response.message || 'Failed to load comments')
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
        message.error('Failed to load comments')
      } finally {
        if (!append) {
          setLoading(false)
        }
      }
    },
    [projectId, sortType]
  )

  // 设置排序类型
  const setSortType = useCallback(
    (sort: 'hot' | 'new') => {
      setSortTypeState(sort)
      fetchComments(sort, 1) // 排序时重置到第一页
    },
    [fetchComments]
  )

  // 加载更多评论
  const loadMoreComments = useCallback(() => {
    if (pagination.has_next) {
      fetchComments(sortType, pagination.page + 1, true)
    }
  }, [fetchComments, sortType, pagination.has_next, pagination.page])

  // 获取评论输入状态
  const getCommentState = useCallback(
    (commentId?: string): CommentInputState => {
      const key = commentId || 'main'
      return (
        commentInputs[key] || {
          content: '',
          images: [],
          expanded: false
        }
      )
    },
    [commentInputs]
  )

  // 更新评论内容
  const updateCommentContent = useCallback(
    (content: string, commentId?: string) => {
      const key = commentId || 'main'
      setCommentInputs(prev => ({
        ...prev,
        [key]: {
          ...getCommentState(commentId),
          content
        }
      }))
    },
    [getCommentState]
  )

  // 设置评论展开状态
  const setCommentExpanded = useCallback(
    (expanded: boolean, commentId?: string) => {
      const key = commentId || 'main'
      setCommentInputs(prev => ({
        ...prev,
        [key]: {
          ...getCommentState(commentId),
          expanded
        }
      }))
    },
    [getCommentState]
  )

  // 上传图片
  const uploadImage = useCallback(
    async (file: File, commentId?: string) => {
      const key = commentId || 'main'
      const currentState = getCommentState(commentId)

      if (currentState.images.length >= 9) {
        message.error('Maximum 9 images allowed')
        return
      }

      // 文件类型验证
      if (!file.type.startsWith('image/')) {
        message.error('Only image files are allowed')
        return
      }

      // 文件大小验证 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        message.error('Image size must be less than 10MB')
        return
      }

      const uid = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 添加上传中的图片
      const uploadingImage: UploadedImage = {
        uid,
        url: URL.createObjectURL(file),
        key: '',
        fileName: file.name,
        status: 'uploading',
        progress: 0
      }

      setCommentInputs(prev => ({
        ...prev,
        [key]: {
          ...currentState,
          images: [...currentState.images, uploadingImage]
        }
      }))

      try {
        // 上传图片
        const result = await uploadFileWithPresigned(file, {
          path: 'comments/images',
          onProgress: progress => {
            setCommentInputs(prev => ({
              ...prev,
              [key]: {
                ...prev[key],
                images: prev[key].images.map(img =>
                  img.uid === uid ? { ...img, progress } : img
                )
              }
            }))
          }
        })

        if (result.success && result.key) {
          // 上传成功
          setCommentInputs(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              images: prev[key].images.map(img =>
                img.uid === uid
                  ? {
                      ...img,
                      status: 'done' as const,
                      progress: 100,
                      key: result.key!,
                      url: getImageLink(result.key)!,
                      fileName: result.fileName || file.name
                    }
                  : img
              )
            }
          }))
          message.success('Image uploaded successfully')
        } else {
          // 上传失败
          setCommentInputs(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              images: prev[key].images.map(img =>
                img.uid === uid
                  ? { ...img, status: 'error' as const, progress: 0 }
                  : img
              )
            }
          }))
          message.error('Failed to upload image')
        }
      } catch (error) {
        // 上传异常
        setCommentInputs(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            images: prev[key].images.map(img =>
              img.uid === uid
                ? { ...img, status: 'error' as const, progress: 0 }
                : img
            )
          }
        }))
        message.error('Failed to upload image. Please try again')
      }
    },
    [getCommentState, message]
  )

  // 删除图片
  const deleteImage = useCallback(
    (uid: string, commentId?: string) => {
      const key = commentId || 'main'
      const currentState = getCommentState(commentId)

      setCommentInputs(prev => ({
        ...prev,
        [key]: {
          ...currentState,
          images: currentState.images.filter(img => img.uid !== uid)
        }
      }))
    },
    [getCommentState]
  )

  // 清空评论输入状态
  const clearCommentState = useCallback((commentId?: string) => {
    const key = commentId || 'main'
    setCommentInputs(prev => {
      const newCommentInputs = { ...prev }
      delete newCommentInputs[key]
      return newCommentInputs
    })
  }, [])

  // 创建评论
  const createComment = useCallback(
    async (
      params: Omit<CreateProjectCommentParams, 'project_id'>,
      commentId?: string
    ) => {
      try {
        const response = await createProjectComment({
          ...params,
          project_id: projectId
        })

        if (response.success && response.data) {
          message.success('Comment posted successfully')

          // 增量更新：直接添加新评论到本地状态
          const newComment = response.data

          // 辅助函数：检查一个回复是否包含指定ID的子回复
          const hasReplyWithId = (reply: any, targetId: string): boolean => {
            if (reply.id === targetId) {
              return true
            }
            return (
              reply.replies?.some((childReply: any) =>
                hasReplyWithId(childReply, targetId)
              ) || false
            )
          }

          setComments(prev => {
            // 如果是回复评论，需要找到对应的主评论并插入到正确位置
            if (newComment.parent_id) {
              // 查找所有主评论，找到包含目标父评论的主评论
              return prev.map(mainComment => {
                // 检查新回复是否属于这个主评论
                // 由于评论结构是压平的，所有回复都在主评论的replies数组中
                const belongsToThisComment = (parentId: string): boolean => {
                  // 如果直接回复主评论
                  if (parentId === mainComment.id) {
                    return true
                  }
                  // 如果回复的是主评论的某个回复（所有回复都在replies数组中）
                  return (
                    mainComment.replies?.some(reply => reply.id === parentId) ||
                    false
                  )
                }

                if (belongsToThisComment(newComment.parent_id!)) {
                  // 检查是否已经存在相同的回复
                  const existingReplyIds = new Set(
                    mainComment.replies?.map(r => r.id) || []
                  )

                  // 如果回复已存在，则不添加
                  if (existingReplyIds.has(newComment.id)) {
                    return mainComment
                  }

                  // 找到插入位置：在直接父评论之后插入
                  const replies = mainComment.replies || []
                  let insertIndex = replies.length // 默认插入到末尾

                  // 查找直接父评论的位置
                  const parentIndex = replies.findIndex(
                    r => r.id === newComment.parent_id
                  )
                  if (parentIndex !== -1) {
                    // 在父评论之后插入
                    insertIndex = parentIndex + 1
                  } else {
                    // 如果没找到直接父评论，查找父评论的父评论等（递归查找）
                    for (let i = 0; i < replies.length; i++) {
                      if (hasReplyWithId(replies[i], newComment.parent_id!)) {
                        insertIndex = i + 1
                        break
                      }
                    }
                  }

                  // 插入新回复
                  const newReplies = [...replies]
                  newReplies.splice(insertIndex, 0, newComment)

                  return {
                    ...mainComment,
                    replies: newReplies,
                    replies_count: (mainComment.replies_count || 0) + 1
                  }
                }
                return mainComment
              })
            }

            // 主评论：根据排序方式决定插入位置
            // 检查是否已经存在相同的主评论
            const existingCommentIds = new Set(prev.map(c => c.id))
            if (existingCommentIds.has(newComment.id)) {
              return prev
            }

            if (sortType === 'new') {
              return [newComment, ...prev]
            } else {
              // 'hot' 排序时，新评论可能需要特殊处理，暂时插入到开头
              return [newComment, ...prev]
            }
          })

          // 更新分页信息
          setPagination(prev => ({
            ...prev,
            total: prev.total + 1
          }))

          // 注意：现在缓存清除完全由调用方（组件）控制
          // 提交成功后不在这里清空缓存，而是在组件中根据提交结果决定是否清空
        } else {
          message.error(response.message || 'Failed to post comment')
        }
      } catch (error) {
        console.error('Failed to create comment:', error)
        message.error('Failed to post comment. Please try again')
      }
    },
    [projectId, sortType, clearCommentState, message]
  )

  // 更新评论
  const updateComment = useCallback(
    async (id: string, params: Omit<UpdateProjectCommentParams, 'id'>) => {
      try {
        const response = await updateProjectComment({
          ...params,
          id
        })

        if (response.success && response.data) {
          message.success('Comment updated successfully')

          // 增量更新：直接更新本地状态中的对应评论
          const updatedComment = response.data
          setComments(prev => {
            return prev.map(comment => {
              if (comment.id === updatedComment.id) {
                return updatedComment
              }

              // 检查是否是回复评论
              if (comment.replies) {
                const updatedReplies = comment.replies.map(reply =>
                  reply.id === updatedComment.id ? updatedComment : reply
                )
                if (updatedReplies !== comment.replies) {
                  return { ...comment, replies: updatedReplies }
                }
              }

              return comment
            })
          })
        } else {
          message.error(response.message || 'Failed to update comment')
        }
      } catch (error) {
        console.error('Failed to update comment:', error)
        message.error('Failed to update comment. Please try again')
      }
    },
    []
  )

  // 删除评论
  const deleteComment = useCallback(
    async (id: string) => {
      try {
        const response = await deleteProjectComment(id)

        if (response.success) {
          message.success('Comment deleted successfully')

          // 递归收集所有需要清空的评论ID（包括被删除评论及其所有子评论）
          // 由于评论结构是压平的，我们需要根据parent_id关系来收集所有子评论
          const collectAllCommentIds = (targetCommentId: string): string[] => {
            const ids = [targetCommentId]

            // 递归查找所有以targetCommentId为parent_id的评论
            const findChildComments = (parentId: string) => {
              comments.forEach(mainComment => {
                if (mainComment.replies) {
                  mainComment.replies.forEach(reply => {
                    if (reply.parent_id === parentId) {
                      ids.push(reply.id)
                      findChildComments(reply.id) // 递归查找子评论的子评论
                    }
                  })
                }
              })
            }

            findChildComments(targetCommentId)
            return ids
          }

          // 先从当前评论列表中找到被删除的评论以收集所有相关ID
          const findDeletedComment = (commentsList: any[]): any => {
            for (const comment of commentsList) {
              if (comment.id === id) {
                return comment
              }
              if (comment.replies) {
                const found = findDeletedComment(comment.replies)
                if (found) return found
              }
            }
            return null
          }

          const deletedComment = findDeletedComment(comments)
          const deletedCommentIds = new Set<string>()

          if (deletedComment) {
            collectAllCommentIds(deletedComment.id).forEach(commentId => {
              deletedCommentIds.add(commentId)
            })
          }

          // 使用批量状态更新来避免竞争条件
          const isMainComment = comments.some(comment => comment.id === id)

          // 批量更新所有相关状态
          setComments(prev => {
            if (isMainComment) {
              // 删除主评论（包括其所有子评论）
              return prev.filter(comment => comment.id !== id)
            } else {
              // 删除回复评论，需要递归删除该评论及其所有子评论
              // 由于评论结构是压平的，需要根据parent_id关系递归删除

              return prev.map(comment => {
                if (comment.replies && comment.replies.length > 0) {
                  // 使用已收集的deletedCommentIds来过滤掉所有需要删除的评论
                  const filteredReplies = comment.replies.filter(
                    reply => !deletedCommentIds.has(reply.id)
                  )

                  const deletedCount =
                    comment.replies.length - filteredReplies.length

                  if (deletedCount > 0) {
                    return {
                      ...comment,
                      replies: filteredReplies,
                      replies_count: Math.max(
                        0,
                        (comment.replies_count || 0) - deletedCount
                      )
                    }
                  }
                }
                return comment
              })
            }
          })

          // 同步更新分页信息
          setPagination(prev => ({
            ...prev,
            total: Math.max(0, prev.total - 1)
          }))

          // 同步清空相关的评论输入状态
          setCommentInputs(prev => {
            const newCommentInputs = { ...prev }

            // 清空所有被删除评论的输入状态
            deletedCommentIds.forEach(commentId => {
              delete newCommentInputs[commentId]
            })

            return newCommentInputs
          })

          // 同步处理回复状态
          setActiveReplyId(prev => {
            // 如果当前正在回复被删除的评论或其子评论，则关闭回复状态
            if (deletedCommentIds.has(prev || '')) {
              return null
            }
            return prev
          })
        } else {
          message.error(response.message || 'Failed to delete comment')
        }
      } catch (error) {
        console.error('Failed to delete comment:', error)
        message.error('Failed to delete comment. Please try again')
      }
    },
    [message, comments]
  )

  // 切换回复状态
  const toggleReply = useCallback(
    (commentId: string) => {
      setActiveReplyId(prev => {
        if (prev === commentId) {
          // 如果当前已经是激活状态，则关闭并可选择性地保留状态
          return null
        } else {
          // 激活新的回复状态，并确保展开状态
          const key = commentId || 'main'
          setCommentInputs(prev => ({
            ...prev,
            [key]: {
              ...getCommentState(commentId),
              expanded: true
            }
          }))
          return commentId
        }
      })
    },
    [getCommentState]
  )

  // 加载更多回复
  const loadMoreReplies = useCallback(
    async (commentId: string) => {
      try {
        // 找到对应的评论
        const comment = comments.find(c => c.id === commentId)
        if (!comment) return

        // 计算当前已加载的回复数量
        const currentRepliesCount = comment.replies?.length || 0

        // 如果已加载的回复数量大于等于总回复数量，则不需要加载更多
        if (currentRepliesCount >= (comment.replies_count || 0)) {
          return
        }

        // 计算要加载的页码
        // 使用简单的分页逻辑，依靠过滤机制处理重复数据
        const page = Math.floor(currentRepliesCount / 20) + 1

        const params: ProjectCommentParams = {
          project_id: projectId,
          parent_id: commentId,
          page,
          limit: 20,
          sort: 'new'
        }

        const response = await getProjectComments(params)

        if (response.success && response.data) {
          // 增量更新：将新的回复添加到现有回复列表中
          setComments(prev =>
            prev.map(c => {
              if (c.id === commentId) {
                // 获取现有回复的ID集合
                const existingReplyIds = new Set(
                  c.replies?.map(r => r.id) || []
                )

                // 过滤掉已存在的回复，只添加新的回复
                const newReplies = response.data!.comments.filter(
                  newReply => !existingReplyIds.has(newReply.id)
                )

                return {
                  ...c,
                  replies: [...(c.replies || []), ...newReplies]
                }
              }
              return c
            })
          )
        }
      } catch (error) {
        console.error('Failed to load more replies:', error)
        message.error('Failed to load more replies')
      }
    },
    [comments, projectId, message]
  )

  // 点赞/取消点赞
  const toggleLike = useCallback(
    async (commentId: string) => {
      // 保存当前状态以备回滚
      const previousState = comments.slice()

      // 找到目标评论并获取当前状态
      let currentComment: ProjectComment | null = null
      let isMainComment = false

      for (const comment of comments) {
        if (comment.id === commentId) {
          currentComment = comment
          isMainComment = true
          break
        }
        if (comment.replies) {
          const reply = comment.replies.find(r => r.id === commentId)
          if (reply) {
            currentComment = reply
            isMainComment = false
            break
          }
        }
      }

      if (!currentComment) return

      // 预测新状态（乐观更新）
      const newLikedState = !currentComment.is_liked
      const newLikesCount =
        currentComment.likes_count + (newLikedState ? 1 : -1)

      // 立即更新UI状态
      setComments(prev => {
        return prev.map(comment => {
          // 检查是否是主评论
          if (comment.id === commentId) {
            return {
              ...comment,
              likes_count: newLikesCount,
              is_liked: newLikedState
            }
          }

          // 检查是否是回复评论
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply =>
              reply.id === commentId
                ? {
                    ...reply,
                    likes_count: newLikesCount,
                    is_liked: newLikedState
                  }
                : reply
            )

            // 只有在回复列表有变化时才更新
            if (
              updatedReplies.some(
                (reply, index) =>
                  reply.likes_count !== comment.replies![index].likes_count ||
                  reply.is_liked !== comment.replies![index].is_liked
              )
            ) {
              return { ...comment, replies: updatedReplies }
            }
          }

          return comment
        })
      })

      try {
        // 发送API请求
        const response = await toggleCommentLike(commentId)

        if (response.success && response.data) {
          // 请求成功，使用服务器返回的实际数据更新状态
          setComments(prev => {
            return prev.map(comment => {
              // 检查是否是主评论
              if (comment.id === commentId) {
                return {
                  ...comment,
                  likes_count: response.data!.like_count,
                  is_liked: response.data!.liked
                }
              }

              // 检查是否是回复评论
              if (comment.replies) {
                const updatedReplies = comment.replies.map(reply =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        likes_count: response.data!.like_count,
                        is_liked: response.data!.liked
                      }
                    : reply
                )

                // 只有在回复列表有变化时才更新
                if (
                  updatedReplies.some(
                    (reply, index) =>
                      reply.likes_count !==
                        comment.replies![index].likes_count ||
                      reply.is_liked !== comment.replies![index].is_liked
                  )
                ) {
                  return { ...comment, replies: updatedReplies }
                }
              }

              return comment
            })
          })

          // // 显示成功消息
          // const action = response.data.liked ? 'liked' : 'unliked'
          // message.success(`Comment ${action} successfully`)
        } else {
          // 请求失败，回滚到之前状态
          setComments(previousState)
          message.error(response.message || 'Failed to toggle like')
        }
      } catch (error) {
        // 请求异常，回滚到之前状态
        setComments(previousState)
        console.error('Failed to toggle like:', error)
        message.error('Failed to toggle like. Please try again')
      }
    },
    [comments, message]
  )

  // 初始化时自动获取评论
  useEffect(() => {
    if (projectId) {
      fetchComments()
    }
  }, [projectId, fetchComments])

  return {
    // 状态
    comments,
    loading,
    pagination,
    sortType,
    activeReplyId,

    // 方法
    fetchComments,
    setSortType,
    loadMoreComments,
    createComment,
    updateComment,
    deleteComment,
    toggleReply,
    loadMoreReplies,
    toggleLike,
    getCommentState,
    updateCommentContent,
    setCommentExpanded,
    clearCommentState,
    uploadImage,
    deleteImage
  }
}

export default useComment
