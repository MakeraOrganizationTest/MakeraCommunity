'use client'

import { useState, useRef } from 'react'
import { Upload, message, Avatar } from 'antd'
import { LoadingOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'
import { Cropper } from 'react-mobile-cropper'
import 'react-mobile-cropper/dist/style.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { uploadAvatarWithPresigned } from '@/api/client/upload'
import { dataURLToFile } from '@/lib/file'
import { getFileLink } from '@/lib/link'
import { useAuth } from '@/hooks/use-auth'

interface AvatarUploaderProps {
  initialImage?: string
  onImageChange?: (image: string) => void
  className?: string
  size?: number
}

export default function AvatarUploader({
  initialImage,
  onImageChange,
  className,
  size = 100
}: AvatarUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImage)
  const [tempImage, setTempImage] = useState<string | undefined>()
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const cropperRef = useRef<any>(null)
  const { user } = useAuth()

  // 上传前处理 - 用于文件验证和预处理
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件!')
      return false
    }

    const isLt5M = file.size / 1024 / 1024 < 30
    if (!isLt5M) {
      message.error('图片大小不能超过 30MB!')
      return false
    }

    // 读取文件并显示裁剪器
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTempImage(reader.result)
        setIsCropperOpen(true)
      }
    }
    reader.readAsDataURL(file)

    // 返回 false 阻止默认上传，我们将在裁剪后手动上传
    return false
  }

  // 处理裁剪完成
  const handleCropDone = async () => {
    if (cropperRef.current) {
      try {
        const canvas = cropperRef.current.getCanvas()

        if (canvas) {
          setLoading(true)
          setUploadProgress(0)

          try {
            // 从canvas获取base64图像数据
            const croppedImage = canvas.toDataURL('image/jpeg')

            // 将 base64 转换为 File 对象
            const file = dataURLToFile(
              croppedImage,
              `${user?.id || 'user'}.jpeg`
            )

            // 使用预签名头像上传函数上传
            const result = await uploadAvatarWithPresigned(file, {
              fileName: `${user?.id || 'user'}`,
              onProgress: progress => {
                setUploadProgress(progress)
              }
            })

            if (result.success && result.key) {
              // 使用统一的链接处理函数构建图片URL
              const finalImageUrl = getFileLink(result.key)

              if (finalImageUrl) {
                setImageUrl(finalImageUrl)
                onImageChange?.(finalImageUrl)
                message.success('头像上传成功!')
              }
            } else {
              throw new Error(result.error || '头像上传失败')
            }
          } catch (error) {
            console.error('头像上传出错:', error)
            message.error('上传失败，请重试')
          } finally {
            setLoading(false)
            setUploadProgress(0)
            setIsCropperOpen(false)
            setTempImage(undefined)
          }
        }
      } catch (error) {
        console.error('裁剪失败:', error)
        message.error('裁剪失败')
        setLoading(false)
      }
    }
  }

  // 取消裁剪
  const handleCropCancel = () => {
    setIsCropperOpen(false)
    setTempImage(undefined)
  }

  // Upload 组件的上传按钮
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>{loading ? '上传中' : '点击上传'}</div>
    </div>
  )

  return (
    <>
      <Upload
        name="avatar"
        listType="picture-circle"
        className={cn('avatar-uploader', className)}
        showUploadList={false}
        beforeUpload={beforeUpload}
        disabled={loading}
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <Avatar
            size={size}
            src={imageUrl}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          uploadButton
        )}
      </Upload>

      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>裁剪头像</DialogTitle>
          </DialogHeader>

          <div className="mt-4 h-[400px] w-[400px]">
            {tempImage && (
              <Cropper
                className="h-full w-full bg-transparent"
                boundaryClassName="bg-transparent"
                backgroundClassName="bg-transparent"
                ref={cropperRef}
                src={tempImage}
                stencilProps={{
                  aspectRatio: 1,
                  overlayClassName: 'rounded-full'
                }}
              />
            )}
          </div>

          {/* 上传进度条 */}
          {loading && uploadProgress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>上传进度</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={handleCropCancel}
              disabled={loading}
            >
              取消
            </Button>
            <Button onClick={handleCropDone} disabled={loading}>
              {loading ? <LoadingOutlined className="mr-2" /> : null}
              {loading ? `上传中 ${uploadProgress}%` : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
