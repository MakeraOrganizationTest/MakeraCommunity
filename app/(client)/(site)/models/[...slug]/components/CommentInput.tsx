'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Image, message } from 'antd'
import { MIconImage, MIconCloseFill } from '@/components/icons'
import { UPLOAD_FILE_TYPE } from '@/constants/upload'
import type { CreateProjectCommentParams } from '@/types/comment'

// 上传图片状态接口
interface UploadedImage {
  uid: string
  url: string
  key: string
  fileName: string
  status: 'uploading' | 'done' | 'error'
  progress: number
}

interface CommentInputProps {
  placeholder?: string
  defaultExpanded?: boolean
  defaultHeight?: number
  commentId?: string // 用于区分不同评论的输入状态
  onCommentCreated?: (
    params: Omit<CreateProjectCommentParams, 'project_id'>,
    commentId?: string
  ) => Promise<void>

  // 新的状态管理方法
  getCommentState?: (commentId?: string) => {
    content: string
    images: UploadedImage[]
    expanded: boolean
  }
  updateCommentContent?: (content: string, commentId?: string) => void
  setCommentExpanded?: (expanded: boolean, commentId?: string) => void
  uploadImage?: (file: File, commentId?: string) => Promise<void>
  deleteImage?: (uid: string, commentId?: string) => void
  clearCommentState?: (commentId?: string) => void
}

export default function CommentInput({
  placeholder = 'Say something...',
  defaultExpanded = false,
  defaultHeight = 100,
  commentId,
  onCommentCreated,
  getCommentState,
  updateCommentContent,
  setCommentExpanded,
  uploadImage,
  deleteImage,
  clearCommentState
}: CommentInputProps) {
  // 获取当前评论的状态
  const commentState = getCommentState?.(commentId) || {
    content: '',
    images: [],
    expanded: false
  }

  const [isFocused, setIsFocused] = useState(
    defaultExpanded || commentState.expanded
  )
  const [rows, setRows] = useState(
    defaultExpanded || commentState.expanded ? 5 : 1
  )
  const [textareaHeight, setTextareaHeight] = useState(defaultHeight)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const uploadRef = useRef<any>(null)

  // 使用状态管理中的值
  const value = commentState.content
  const uploadedImages = commentState.images

  // 计算最小最大高度
  const minHeight = Math.max(defaultHeight, 48)
  const maxHeight = Math.max(defaultHeight * 4, 400)

  // 当聚焦或有内容时，设置为5行
  useEffect(() => {
    if (defaultExpanded || commentState.expanded) {
      setRows(5)
      setIsFocused(true)
    } else if (isFocused || value.trim()) {
      setRows(5)
    } else {
      setRows(1)
    }
  }, [isFocused, value, defaultExpanded, commentState.expanded])

  const handleFocus = () => {
    setIsFocused(true)
    setCommentExpanded?.(true, commentId)
  }

  const handleBlur = () => {
    if (!defaultExpanded && !value.trim()) {
      setIsFocused(false)
      setCommentExpanded?.(false, commentId)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateCommentContent?.(e.target.value, commentId)
  }

  const handleSubmit = async () => {
    if (!value.trim() && uploadedImages.length === 0) {
      message.error('Please enter comment content or upload images')
      return
    }

    if (!onCommentCreated) {
      message.error('Comment function is not available')
      return
    }

    try {
      setIsSubmitting(true)

      // 获取已上传成功的图片链接
      const imageKeys = uploadedImages
        .filter(img => img.status === 'done')
        .map(img => img.key)

      // 调用回调函数创建评论
      await onCommentCreated(
        {
          content: value.trim(),
          images: imageKeys
        },
        commentId
      )

      // 成功后不需要手动清空，hook 会自动处理
      if (!defaultExpanded) {
        setIsFocused(false)
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      message.error('Failed to post comment. Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageClick = () => {
    if (uploadedImages.length >= 9) {
      message.error('Maximum 9 images allowed')
      return
    }
    uploadRef.current?.click()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    // 遍历粘贴的项目，查找图片文件
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // 检查是否是图片类型
      if (item.type.startsWith('image/')) {
        e.preventDefault() // 阻止默认粘贴行为

        const file = item.getAsFile()
        if (file) {
          console.log('Pasted image file:', file)
          uploadImage?.(file, commentId)
        }
        break
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => uploadImage?.(file, commentId))
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }

  const handleDeleteImage = (uid: string) => {
    deleteImage?.(uid, commentId)
  }

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const startY = e.clientY
    const startHeight = textareaHeight

    // 设置拖拽期间的cursor样式
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaY = e.clientY - startY
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight + deltaY)
      )
      setTextareaHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      // 恢复默认样式
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 是否显示操作栏
  const showActionBar = isFocused || value.trim() || uploadedImages.length > 0
  const doneImages = uploadedImages.filter(img => img.status === 'done')

  return (
    <div className="w-full">
      <div
        ref={wrapperRef}
        className={`relative box-border w-full overflow-hidden rounded-[12px] border border-border transition-all duration-200 ${
          rows === 1
            ? 'h-[48px] bg-background'
            : 'border-foreground bg-card dark:border-border'
        }`}
      >
        {/* 输入框容器 */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          onPaste={handlePaste}
          rows={rows}
          placeholder={placeholder}
          className="box-border w-full resize-none border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-text-muted"
          style={{
            height: rows === 1 ? '48px' : `${textareaHeight}px`,
            maxHeight: `${maxHeight}px`,
            overflowY: 'auto',
            resize: 'none',
            transition: isDragging ? 'none' : 'height 0.2s ease-in-out'
          }}
        />

        {/* 操作栏 */}
        {showActionBar && (
          <div
            className="flex items-center justify-between px-4 pt-2 pb-3"
            onMouseDown={e => {
              // 阻止操作栏点击时失去焦点
              e.preventDefault()
            }}
          >
            <div className="flex items-center">
              <Button
                size="small"
                icon={<MIconImage className="text-text-primary" />}
                onClick={handleImageClick}
                disabled={uploadedImages.length >= 9}
                className="flex items-center gap-1 px-2! hover:border-text-primary! hover:text-text-primary!"
              >
                Photos ({doneImages.length}/9)
              </Button>

              {/* 隐藏的文件输入 */}
              <input
                ref={uploadRef}
                type="file"
                accept={UPLOAD_FILE_TYPE.IMAGE}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex items-center">
              <Button
                color="default"
                variant="solid"
                size="small"
                onClick={handleSubmit}
                disabled={
                  (!value.trim() && doneImages.length === 0) || isSubmitting
                }
                loading={isSubmitting}
                className="px-4!"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        )}

        {/* 右下角拖拽图标 */}
        {rows > 1 && (
          <div
            className={`absolute right-[1px] bottom-[1px] z-10 cursor-ns-resize text-[10px] opacity-60 hover:opacity-100 ${
              isDragging ? 'opacity-100' : ''
            }`}
            onMouseDown={handleMouseDown}
          >
            <svg
              width="1em"
              height="1em"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 11L11 1M6 11L11 6M1 6L6 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 图片墙 */}
      {uploadedImages.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9">
          {uploadedImages.map(image => (
            <div
              key={image.uid}
              className="relative aspect-square h-full w-full overflow-hidden rounded-[12px] border border-border bg-card"
            >
              {/* 图片预览 */}
              <Image
                src={image.url}
                alt={image.fileName}
                className="aspect-square h-full w-full object-cover"
              />

              {/* 上传状态覆盖层 */}
              {image.status === 'uploading' && (
                <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-black/50 text-white">
                  {image.progress}%
                </div>
              )}

              {/* 错误状态覆盖层 */}
              {image.status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/50">
                  <div className="text-center text-white">
                    <div className="text-xs">Error</div>
                  </div>
                </div>
              )}

              {/* GIF标识 */}
              {image.fileName.toLowerCase().endsWith('.gif') && (
                <div className="absolute bottom-0 left-0 rounded-tr-[12px] bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
                  GIF
                </div>
              )}

              {/* 删除按钮 */}
              <MIconCloseFill
                onClick={() => handleDeleteImage(image.uid)}
                className="absolute top-2 right-2 cursor-pointer text-[14px]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
