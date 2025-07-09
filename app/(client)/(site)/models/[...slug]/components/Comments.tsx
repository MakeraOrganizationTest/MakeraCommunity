'use client'

import { Avatar, Segmented, Spin, Button } from 'antd'
import CommentList from './CommentList'
import CommentInput from './CommentInput'
import { useComment } from '../hooks/comment'
import { useAuth } from '@/hooks/use-auth'
import { ProjectCommentUser, CreateProjectCommentParams } from '@/types/comment'

export default function Comments({
  id,
  author
}: {
  id: string
  author: ProjectCommentUser
}) {
  const {
    comments,
    loading,
    pagination,
    sortType,
    activeReplyId,
    setSortType,
    loadMoreComments,
    createComment,
    deleteComment,
    toggleReply,
    loadMoreReplies,
    toggleLike,
    getCommentState,
    updateCommentContent,
    setCommentExpanded,
    uploadImage,
    deleteImage,
    clearCommentState
  } = useComment(id)
  const { userInfo } = useAuth()

  // 排序切换
  const handleSortChange = (value: string) => {
    setSortType(value.toLowerCase() as 'hot' | 'new')
  }

  // 处理主评论创建
  const handleMainCommentCreated = async (
    params: Omit<CreateProjectCommentParams, 'project_id'>
  ) => {
    try {
      await createComment(params)
      // 提交成功后清空主评论输入框缓存
      clearCommentState()
    } catch (error) {
      // 提交失败时不清空缓存，保留用户输入的内容
      console.error('Failed to create comment:', error)
    }
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="mt-[20px] w-full">
        <div className="flex w-full items-start gap-4">
          <Avatar size={44} src={userInfo?.picture} />
          <div className="w-full flex-1">
            <CommentInput
              onCommentCreated={handleMainCommentCreated}
              getCommentState={getCommentState}
              updateCommentContent={updateCommentContent}
              setCommentExpanded={setCommentExpanded}
              uploadImage={uploadImage}
              deleteImage={deleteImage}
              clearCommentState={clearCommentState}
            />
          </div>
        </div>
        <div className="mt-[40px] w-full">
          <div className="flex w-full justify-end">
            <Segmented<string>
              options={['Hot', 'New']}
              value={sortType === 'hot' ? 'Hot' : 'New'}
              onChange={handleSortChange}
            />
          </div>
          <div className="mt-[40px] flex justify-center py-12">
            <Spin size="large" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-[20px] w-full">
      <div className="flex w-full items-start gap-4">
        <Avatar size={44} src={userInfo?.picture} />
        <div className="w-full flex-1">
          <CommentInput
            onCommentCreated={handleMainCommentCreated}
            getCommentState={getCommentState}
            updateCommentContent={updateCommentContent}
            setCommentExpanded={setCommentExpanded}
            uploadImage={uploadImage}
            deleteImage={deleteImage}
            clearCommentState={clearCommentState}
          />
        </div>
      </div>

      {/* 如果没有评论，显示空状态 */}
      {!comments || comments.length === 0 ? (
        <div className="mt-[40px] flex flex-col items-center justify-center py-12">
          <div className="mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="234"
              height="133"
              viewBox="0 0 234 133"
              fill="none"
              className="h-[133px] w-[234px]"
            >
              <ellipse
                cx="116.715"
                cy="109.141"
                rx="116.715"
                ry="23.2734"
                fill="url(#paint0_linear_481_14128)"
              />
              <path
                d="M65.6064 86.7617C73.1897 89.9037 82.9019 92.8755 91.2504 95.9563C93.5047 96.7882 95.8613 94.8282 95.3835 92.4734L89.5049 63.5L65.6064 86.7617Z"
                fill="url(#paint1_linear_481_14128)"
              />
              <rect
                width="110"
                height="73.3333"
                rx="36.6667"
                transform="matrix(-0.979338 0.202228 0.202228 0.979338 136.729 0.00390625)"
                fill="url(#paint2_linear_481_14128)"
              />
              <circle
                cx="4.88889"
                cy="4.88889"
                r="4.88889"
                transform="matrix(-0.979338 0.202228 0.202228 0.979338 113.23 37.3066)"
                fill="#BBC4CD"
              />
              <circle
                cx="4.88889"
                cy="4.88889"
                r="4.88889"
                transform="matrix(-0.979338 0.202228 0.202228 0.979338 94.0781 41.2617)"
                fill="#BBC4CD"
              />
              <circle
                cx="4.88889"
                cy="4.88889"
                r="4.88889"
                transform="matrix(-0.979338 0.202228 0.202228 0.979338 74.9248 45.2168)"
                fill="#BBC4CD"
              />
              <rect
                x="138.014"
                y="77.6133"
                width="12.9965"
                height="19.0527"
                transform="rotate(45 138.014 77.6133)"
                fill="#FF8AD0"
              />
              <rect
                x="138.014"
                y="77.6133"
                width="5.98721"
                height="19.0527"
                transform="rotate(45 138.014 77.6133)"
                fill="#FF5ABD"
              />
              <path
                d="M124.594 100.224L133.73 100.278L124.54 91.0883L124.594 100.224Z"
                fill="#FFDEF2"
              />
              <path
                d="M126.886 100.235L124.602 100.221L124.589 97.9374L124.587 96.5006L128.58 100.235L126.886 100.235Z"
                fill="#37222C"
              />
              <path
                d="M138.014 77.6133L147.204 86.8032L149.366 84.6407C150.72 83.2872 150.720 81.0928 149.366 79.7394L145.078 75.4507C143.724 74.0973 141.53 74.0973 140.176 75.4507L138.014 77.6133Z"
                fill="#FF3499"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_481_14128"
                  x1="114"
                  y1="134"
                  x2="111"
                  y2="31"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#F5FAFF" stopOpacity="0" />
                  <stop offset="1" stopColor="#D7DEE6" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_481_14128"
                  x1="91.501"
                  y1="94"
                  x2="84.1186"
                  y2="81.8225"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#E7EDF3" />
                  <stop offset="1" stopColor="#C5D1DD" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_481_14128"
                  x1="106.989"
                  y1="59.5952"
                  x2="5.91159"
                  y2="0.310932"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#D6DFE8" />
                  <stop offset="1" stopColor="#F5FAFF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="text-sm text-text-muted">No comments yet.</p>
        </div>
      ) : (
        <div className="mt-[40px] w-full">
          <div className="flex w-full justify-end">
            <Segmented<string>
              options={['Hot', 'New']}
              value={sortType === 'hot' ? 'Hot' : 'New'}
              onChange={handleSortChange}
            />
          </div>
          <div className="w-full">
            <CommentList
              user={userInfo}
              author={author}
              comments={comments}
              activeReplyId={activeReplyId}
              onReplyToggle={toggleReply}
              onCommentCreated={createComment}
              onCommentDelete={deleteComment}
              onToggleLike={toggleLike}
              getCommentState={getCommentState}
              updateCommentContent={updateCommentContent}
              setCommentExpanded={setCommentExpanded}
              uploadImage={uploadImage}
              deleteImage={deleteImage}
              clearCommentState={clearCommentState}
              onLoadMoreReplies={loadMoreReplies}
            />
            {pagination.has_next && (
              <div className="-translate-y-1/2">
                <Button onClick={loadMoreComments} size="small">
                  Load more
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
