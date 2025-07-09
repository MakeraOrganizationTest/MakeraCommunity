'use client'
import LikeButton from './components/LikeButton'
import AvatarUploader from './components/AvatarUploader'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import MKCUploader from './components/MKCUploader'
import ModelImageUploader from './components/ModelImageUploader'
import ModelUploader from './components/ModelUploader'
import STLThumbnailGenerator from '@/app/(client)/(site)/test/components/STLThumbnailGenerator'
import { Button, Checkbox, Form, Input } from 'antd'
import type { FormProps } from 'antd'
import * as Icons from '@/components/icons'

type FieldType = {
  username?: string
  password?: string
  remember?: string
}

const onFinish: FormProps<FieldType>['onFinish'] = values => {
  console.log('Success:', values)
}

const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = errorInfo => {
  console.log('Failed:', errorInfo)
}

export default function Upload() {
  const [isContentLiked, setIsContentLiked] = useState(true)
  const [avatarImage, setAvatarImage] = useState<string | undefined>()
  const [modelImages, setModelImages] = useState<string[]>([])
  const [model, setModel] = useState<string[]>([])

  const handleImageChange = (imageUrl: string) => {
    setAvatarImage(imageUrl)
    toast.success('头像已更新')
  }

  const handleFilesChange = (files: string[]) => {
    setModel(files)
    toast.success('模型已更新')
  }

  const handleModelImagesChange = (images: string[]) => {
    setModelImages(images)
    toast.success(`模型图片已更新，共 ${images.length} 张`)
  }

  return (
    <>
      <div className="max-w-[1920px] px-10 py-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
          所有图标组件展示
        </h2>
        <div className="grid grid-cols-8 gap-0 rounded-lg border border-gray-200 dark:border-gray-700">
          {Object.entries(Icons).map(([iconName, IconComponent]) => {
            // 过滤掉非React组件的导出
            if (typeof IconComponent !== 'function') return null

            return (
              <div
                key={iconName}
                className="flex flex-col items-center justify-center border border-border p-4"
              >
                <div className="mb-2 flex items-center justify-center text-2xl text-[26px]">
                  <IconComponent />
                </div>
                <span className="text-xs">{iconName}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input size="small" />
        </Form.Item>

        <Form.Item<FieldType>
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password size="small" />
        </Form.Item>

        <Form.Item<FieldType>
          name="remember"
          valuePropName="checked"
          label={null}
        >
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit" size="small">
            Submit
          </Button>
        </Form.Item>
      </Form>

      <div className="min-h-screen w-full bg-gray-50 p-5 dark:bg-background">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="rounded-xl bg-white p-6 shadow-sm dark:border dark:border-border dark:bg-card dark:shadow-md">
            <div className="flex flex-col items-center rounded-lg border bg-gray-50 p-8 dark:border-border dark:bg-muted">
              <AvatarUploader
                initialImage={avatarImage}
                onImageChange={handleImageChange}
                size={120}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm dark:border dark:border-border dark:bg-card dark:shadow-md">
            <div className="flex flex-col items-center rounded-lg border bg-gray-50 p-8 dark:border-border dark:bg-muted">
              <LikeButton
                isLiked={isContentLiked}
                onChange={setIsContentLiked}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm dark:border dark:border-border dark:bg-card dark:shadow-md">
            <div className="flex flex-col items-center rounded-lg border bg-gray-50 p-8 dark:border-border dark:bg-muted">
              <MKCUploader />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm dark:border dark:border-border dark:bg-card dark:shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            模型上传
          </h3>
          <div className="rounded-lg border bg-gray-50 p-6 dark:border-border dark:bg-muted">
            <ModelUploader
              uploadPath="m/test-model-123"
              maxCount={5}
              maxSize={20} // 10MB
              onFilesChange={handleFilesChange}
            />
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm dark:border dark:border-border dark:bg-card dark:shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            模型图片上传
          </h3>
          <div className="rounded-lg border bg-gray-50 p-6 dark:border-border dark:bg-muted">
            <ModelImageUploader
              modelId="test-model-images-123"
              initialImages={modelImages}
              onImagesChange={handleModelImagesChange}
              maxCount={15}
            />
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm dark:border dark:border-border dark:bg-card dark:shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            STL 缩略图生成器 (白模 4:3 比例 - 自动视角)
          </h3>
          <div className="rounded-lg border bg-gray-50 p-6 dark:border-border dark:bg-muted">
            <STLThumbnailGenerator
              thumbnailSize={256}
              aspectRatio={4 / 3}
              className="mx-auto max-w-2xl"
            />
          </div>
        </div>
      </div>
    </>
  )
}
