import { Avatar, Dropdown, Tag, Button, App } from 'antd'
import type { MenuProps } from 'antd'
import {
  MIconLike,
  MIconLikeFill,
  MIconComment,
  MIconMore,
  MIconReport,
  MIconDelete2
} from '@/components/icons'
import CommentInput from './CommentInput'
import type { ProjectComment } from '@/types/comment'
import type { CreateProjectCommentParams } from '@/types/comment'
import { formatSmartDateTime } from '@/lib/format'
import type { User } from '@/types/user'
import { getImageLink } from '@/lib/link'
import { ProjectCommentUser } from '@/types/comment'

// 上传图片状态接口
interface UploadedImage {
  uid: string
  url: string
  key: string
  fileName: string
  status: 'uploading' | 'done' | 'error'
  progress: number
}

interface CommentListProps {
  user?: User | null | undefined
  author: ProjectCommentUser
  comments: ProjectComment[]
  activeReplyId: string | null
  onReplyToggle: (commentId: string) => void
  onCommentCreated: (
    params: Omit<CreateProjectCommentParams, 'project_id'>,
    commentId?: string
  ) => Promise<void>
  onCommentDelete: (commentId: string) => Promise<void>
  onToggleLike: (commentId: string) => Promise<void>

  // 新的状态管理方法
  getCommentState: (commentId?: string) => {
    content: string
    images: UploadedImage[]
    expanded: boolean
  }
  updateCommentContent: (content: string, commentId?: string) => void
  setCommentExpanded: (expanded: boolean, commentId?: string) => void
  uploadImage: (file: File, commentId?: string) => Promise<void>
  deleteImage: (uid: string, commentId?: string) => void
  clearCommentState: (commentId?: string) => void

  onLoadMoreReplies: (commentId: string) => Promise<void>
}

interface CommentItemProps {
  user?: User | null | undefined
  author: ProjectCommentUser
  comment: ProjectComment
  level?: number
  activeReplyId: string | null
  onReplyToggle: (commentId: string) => void
  onCommentCreated: (
    params: Omit<CreateProjectCommentParams, 'project_id'>,
    commentId?: string
  ) => Promise<void>
  onCommentDelete: (commentId: string) => Promise<void>
  onToggleLike: (commentId: string) => Promise<void>

  // 新的状态管理方法
  getCommentState: (commentId?: string) => {
    content: string
    images: UploadedImage[]
    expanded: boolean
  }
  updateCommentContent: (content: string, commentId?: string) => void
  setCommentExpanded: (expanded: boolean, commentId?: string) => void
  uploadImage: (file: File, commentId?: string) => Promise<void>
  deleteImage: (uid: string, commentId?: string) => void
  clearCommentState: (commentId?: string) => void

  onLoadMoreReplies: (commentId: string) => Promise<void>
  mainCommentId: string // 添加主评论ID用于判断
}

function CommentItem({
  user,
  author,
  comment,
  level = 0,
  activeReplyId,
  onReplyToggle,
  onCommentCreated,
  onCommentDelete,
  onToggleLike,
  getCommentState,
  updateCommentContent,
  setCommentExpanded,
  uploadImage,
  deleteImage,
  clearCommentState,
  onLoadMoreReplies,
  mainCommentId
}: CommentItemProps) {
  const { modal } = App.useApp()
  // 处理删除评论
  const handleDeleteComment = () => {
    modal.confirm({
      title: 'Delete Comment',
      content:
        'Are you sure you want to delete this comment? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await onCommentDelete(comment.id)
        } catch (error) {
          console.error('Failed to delete comment:', error)
        }
      }
    })
  }

  const moreItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className="flex items-center gap-1 text-sm">
          <MIconReport />
          <span className="font-semibold">Report</span>
        </div>
      )
    },
    // 只有评论作者可以删除自己的评论
    ...(user?.id === comment.user.id
      ? [
          {
            key: '2',
            label: (
              <div className="flex items-center gap-1 text-sm">
                <MIconDelete2 className="text-[16px] text-destructive" />
                <span className="font-semibold">Delete</span>
              </div>
            ),
            onClick: handleDeleteComment
          }
        ]
      : [])
  ]

  // 显示层级最多为2级，但实际数据可以是多级
  const displayLevel = Math.min(level, 1)
  // 判断是否需要显示@用户名：不是直接回复主评论且有parent信息
  const needsPrefix =
    comment.parent_id &&
    comment.parent_id !== mainCommentId &&
    comment.parent?.user?.nick_name

  // 根据显示层级设置样式
  const marginLeft = displayLevel === 0 ? 0 : 48 // 第一级回复缩进48px
  const avatarSize = 44 // 头像大小保持一致
  const marginBottom = 40 // 间距保持一致

  // 计算图片网格布局
  const getImageGridLayout = (imageCount: number) => {
    if (imageCount <= 0) return { cols: 0, rows: 0 }
    if (imageCount === 1) return { cols: 1, rows: 1 }
    if (imageCount === 2) return { cols: 2, rows: 1 }
    if (imageCount === 3) return { cols: 3, rows: 1 }
    if (imageCount === 4) return { cols: 2, rows: 2 }
    if (imageCount <= 6) return { cols: 3, rows: 2 }
    if (imageCount <= 9) return { cols: 3, rows: 3 }
    return { cols: 3, rows: 3 } // 最多9张
  }

  const imageCount = comment.images?.length || 0
  const { cols, rows } = getImageGridLayout(imageCount)
  const displayImages = comment.images?.slice(0, 9) || []

  const handleReplyClick = () => {
    onReplyToggle(comment.id)
  }

  const handleLikeClick = () => {
    onToggleLike(comment.id)
  }

  const isReplyActive = activeReplyId === comment.id

  // 处理回复创建
  const handleReplyCreated = async (
    params: Omit<CreateProjectCommentParams, 'project_id'>
  ) => {
    try {
      // 回复时添加 parent_id，不传递 commentId 因为我们要在这里手动控制清除
      await onCommentCreated({
        ...params,
        parent_id: comment.id
      })

      // 提交成功后：关闭回复框并清空对应的缓存
      onReplyToggle(comment.id)
      clearCommentState(comment.id)
    } catch (error) {
      // 提交失败时不清空缓存，保留用户输入的内容
      console.error('Failed to create reply:', error)
    }
  }

  return (
    <div key={comment.id} className="flex flex-col">
      <div
        className="flex items-start gap-4"
        style={{
          marginLeft: `${marginLeft}px`,
          marginBottom: isReplyActive ? `20px` : `${marginBottom}px`
        }}
      >
        <Avatar
          className="flex-shrink-0"
          size={avatarSize}
          src={comment.user.picture}
        />
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-text-primary">
              {comment.user.nick_name}
            </span>
            {author?.id === comment.user.id && (
              <Tag
                bordered={false}
                className="font-semibold! text-accent!"
                color="green"
              >
                Author
              </Tag>
            )}
            <span className="text-[12px] font-normal text-text-muted">
              {formatSmartDateTime(comment.created_at)}
            </span>
          </div>
          <div className="text-sm leading-5 font-normal text-text-primary">
            {needsPrefix && (
              <div className="inline-flex items-center gap-1">
                <span>Reply</span>
                <span className="font-semibold">
                  @{comment.parent?.user?.nick_name}{' '}
                </span>
                {author?.id === comment.parent?.user?.id && (
                  <Tag
                    bordered={false}
                    className="font-semibold! text-accent!"
                    color="green"
                  >
                    Author
                  </Tag>
                )}
              </div>
            )}
            {comment.content}
          </div>

          {/* 图片展示区域 */}
          {displayImages.length > 0 && (
            <div
              className="max-w-full gap-2 sm:max-w-[378px]"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`
              }}
            >
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-[8px] border border-border bg-muted"
                >
                  <img
                    src={getImageLink(image) || ''}
                    alt={`Comment image ${index + 1}`}
                    className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-[12px] font-medium text-text-muted">
            <div
              className={`flex cursor-pointer items-center gap-1 ${
                comment.is_liked ? 'text-secondary' : 'hover:text-text-primary'
              }`}
              onClick={handleLikeClick}
            >
              {comment.is_liked ? (
                <MIconLikeFill className="text-[14px] text-secondary" />
              ) : (
                <MIconLike className="text-[14px]" />
              )}
              <span>{comment.likes_count}</span>
            </div>
            <div className="h-[12px] w-[1px] bg-border" />
            <div
              className={`flex cursor-pointer items-center gap-1 hover:text-text-primary ${isReplyActive ? 'text-text-primary' : ''}`}
              onClick={handleReplyClick}
            >
              <MIconComment className="text-[14px]" />
              <span>Reply</span>
            </div>
            <Dropdown menu={{ items: moreItems }} placement="bottomRight">
              <div className="ml-1 flex h-[14px] w-[14px] cursor-pointer items-center justify-center hover:text-text-primary">
                <MIconMore />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* 回复输入框 */}
      {isReplyActive && (
        <div
          className="mb-6"
          style={{
            marginLeft: `${marginLeft + avatarSize + 16}px`
          }}
        >
          <CommentInput
            placeholder={`Reply @${comment.user.nick_name}:`}
            defaultExpanded={true}
            defaultHeight={60}
            commentId={comment.id}
            onCommentCreated={handleReplyCreated}
            getCommentState={getCommentState}
            updateCommentContent={updateCommentContent}
            setCommentExpanded={setCommentExpanded}
            uploadImage={uploadImage}
            deleteImage={deleteImage}
            clearCommentState={clearCommentState}
          />
        </div>
      )}

      {/* 递归渲染回复，传递当前用户名作为父级用户名 */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(reply => (
            <CommentItem
              user={user}
              author={author}
              key={reply.id}
              comment={reply}
              level={level + 1}
              activeReplyId={activeReplyId}
              onReplyToggle={onReplyToggle}
              onCommentCreated={onCommentCreated}
              onCommentDelete={onCommentDelete}
              onToggleLike={onToggleLike}
              getCommentState={getCommentState}
              updateCommentContent={updateCommentContent}
              setCommentExpanded={setCommentExpanded}
              uploadImage={uploadImage}
              deleteImage={deleteImage}
              clearCommentState={clearCommentState}
              onLoadMoreReplies={onLoadMoreReplies}
              mainCommentId={mainCommentId}
            />
          ))}

          {/* 加载更多回复按钮 */}
          {comment.replies_count &&
            comment.replies_count > comment.replies.length && (
              <Button
                onClick={() => onLoadMoreReplies(comment.id)}
                size="small"
                className="mb-3 ml-12 -translate-y-1/2"
              >
                View more replies (
                {comment.replies_count - comment.replies.length})
              </Button>
            )}
        </div>
      )}
    </div>
  )
}

export default function CommentList({
  user,
  author,
  comments,
  activeReplyId,
  onReplyToggle,
  onCommentCreated,
  onCommentDelete,
  onToggleLike,
  getCommentState,
  updateCommentContent,
  setCommentExpanded,
  uploadImage,
  deleteImage,
  clearCommentState,
  onLoadMoreReplies
}: CommentListProps) {
  return (
    <div>
      {comments.map(comment => (
        <CommentItem
          user={user}
          author={author}
          key={comment.id}
          comment={comment}
          activeReplyId={activeReplyId}
          onReplyToggle={onReplyToggle}
          onCommentCreated={onCommentCreated}
          onCommentDelete={onCommentDelete}
          onToggleLike={onToggleLike}
          getCommentState={getCommentState}
          updateCommentContent={updateCommentContent}
          setCommentExpanded={setCommentExpanded}
          uploadImage={uploadImage}
          deleteImage={deleteImage}
          clearCommentState={clearCommentState}
          onLoadMoreReplies={onLoadMoreReplies}
          mainCommentId={comment.id}
        />
      ))}
    </div>
  )
}
