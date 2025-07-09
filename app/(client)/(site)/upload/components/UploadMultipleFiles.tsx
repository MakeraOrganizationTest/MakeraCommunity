import React, { useEffect, useState } from 'react'
import { Form, Upload, App } from 'antd'
import { useWatch } from 'antd/es/form/Form'
import { MIconFolder } from '@/components/icons'
import {
  UploadMutipleFilesToServer,
  syncUploadedFiles
} from '../utils/UploadMutipleFilesToServer'
import type { UploadFile } from 'antd'
import { checkFileSize } from '../utils/fileUtils'
import { UPLOAD_TOAST_MESSAGE } from '@/constants/upload'

const { Dragger } = Upload

const UploadMultipleFiles = ({
  FormItemName,
  icon,
  title,
  typesInfo,
  browseFiles,
  staticPath, // 上传到R2的路径
  maxCount = 10, // 最大上传数量
  multiple = true,
  form,
  customUI, // 自定义上传按钮UI
  customProgress // 用来展示自定义进度条
}: {
  FormItemName: string
  icon?: React.ReactNode
  customUI?: React.ReactNode
  title?: string
  typesInfo?: string
  browseFiles?: boolean
  staticPath: string
  maxCount?: number
  multiple?: boolean
  form: any
  customProgress?: (progress: number, file: UploadFile) => void
}) => {
  const { message } = App.useApp()

  // 删除文件，fileList会由form自动更新，但缓存里的需要手动删除
  const formFileList = useWatch([FormItemName], form)
  useEffect(() => {
    syncUploadedFiles(formFileList)
  }, [formFileList])

  // 此时还没有开始上传到服务，在 customRequest 之前触发
  const getValueFromEvent = (e: any) => {
    let fileList = Array.isArray(e) ? e : e?.fileList || []

    // fileList 过滤掉 重复上传的文件
    return fileList.filter(
      (file: any) => file.error?.type !== 'upload-duplicate'
    )
  }

  const isMaxCount = useWatch([FormItemName], form)?.length >= maxCount

  const props = {
    multiple,
    showUploadList: false,

    // 上传前校验
    beforeUpload: (file: UploadFile) => {
      // 个数校验
      const uploadedFiles = form.getFieldValue([FormItemName]) || []
      if (uploadedFiles.length >= maxCount) {
        message.error(UPLOAD_TOAST_MESSAGE.IMAGE_COUNT_LIMIT_EXCEEDED)
        return Upload.LIST_IGNORE // 此时列表中将不展示此文件, onChange 不会被调用
      }

      // 大小校验
      if (!checkFileSize(file)) {
        message.error(UPLOAD_TOAST_MESSAGE.IMAGE_SIZE_TOO_LARGE)
        return Upload.LIST_IGNORE
      }
      return true
    },
    customRequest: async ({ file, onSuccess, onError }: any) => {
      try {
        const filesResponse = await UploadMutipleFilesToServer(
          file,
          staticPath,
          maxCount,

          // 这里不能操作 fileList, 只能把数据传出去，自行更新进度
          (progress, file) => {
            customProgress?.(progress, {
              ...file,
              status: 'uploading',
              progress
            } as any)
          }
        )
        console.log('R2 Response: ', filesResponse)
        filesResponse.forEach((file: any) => {
          // 传给 onSuccess 的值最终在 onValueChange 的file.repsonse 里
          if (file.success) {
            onSuccess(file)
          } else {
            message.error(
              `file ${file.fileName} upload failed, please try again!`
            )
            onError({
              ...file,
              status: 'error',
              type: 'upload-server-failed'
            })
          }
        })
      } catch (error: any) {
        console.log('upload to R2 error: ', error)
        if (error.errorType === 'upload-duplicate') {
          message.error(`file ${error.name} is uploaded, don't upload again!`)
        } else {
          message.error(
            `file ${file.fileName || file.name} upload failed, please try again!`
          )
        }

        // 传入onError的信息会显示在 file.error里，可以在getValueFromEvent 判断，过滤掉重复的文件
        onError({
          ...file,
          status: 'error',
          type: 'upload-duplicate'
        })
      }
    }
  }

  return (
    <>
      <Form.Item
        name={[FormItemName]}
        valuePropName="fileList"
        getValueFromEvent={getValueFromEvent}
        label=""
        noStyle
      >
        <Dragger className="m-ant-upload-drag" {...props}>
          {customUI ? (
            isMaxCount ? null : (
              customUI
            )
          ) : (
            <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-[#F4F7FA80]/50 p-[3.75rem]">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 text-primary">
                  {icon || <MIconFolder className="w-[3.125rem]" />}
                </div>
                <div className="text-foreground">
                  <p className="font-bold">{title || 'Drag files here'}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {typesInfo}
                  </p>
                </div>
                {browseFiles && (
                  <div className="mt-6 flex h-11 items-center justify-center gap-2.5 rounded-lg bg-blue-600/10 px-6 py-4">
                    <div className="justify-start">
                      <span className="text-sm font-semibold text-blue-600 capitalize">
                        Browse Files
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Dragger>
      </Form.Item>
    </>
  )
}

export default UploadMultipleFiles
