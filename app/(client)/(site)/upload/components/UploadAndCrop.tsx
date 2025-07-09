import { useEffect, useState, memo, useRef } from 'react'
import ImgCrop, { ImgCropProps } from 'antd-img-crop'
import { App, Upload } from 'antd'

import type { GetProp, UploadFile, UploadProps } from 'antd'
import { UPLOAD_FILE_TYPE, UPLOAD_TOAST_MESSAGE } from '@/constants/upload'
import { uploadFileWithPresigned } from '@/api/client/upload'
import { UploadFileResponse } from '@/types/upload'
import { checkFileSize } from '../utils/fileUtils'
import { getFileLink } from '@/lib/link'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

export default memo(function UploadAndCrop({
  icon,
  modelId,
  aspect = 4 / 3,
  maxCount = 1,
  className = '',
  defaultFileList = [],
  noNeedCrop = false, // 是否需要裁剪
  onImageUpload,
  onImageRemove
}: {
  icon?: React.ReactNode
  modelId: string
  aspect?: number
  defaultFileList?: any[]
  noNeedCrop?: boolean
  onImageUpload: (files: UploadFileResponse[]) => void
  onImageRemove?: (
    file: UploadFile,
    fileList: UploadFile[]
  ) => boolean | Promise<boolean>
  maxCount?: number
  className?: string
}) {
  const { message } = App.useApp()

  const [fileList, setFileList] = useState<any[]>([])
  const hasInit = useRef(false)

  useEffect(() => {
    if (!hasInit.current && defaultFileList.length > 0) {
      // console.log('defaultFileList4444: ', defaultFileList)
      setFileList(
        defaultFileList.map(file => ({
          url: file.url,
          status: 'done',
          uid: '',
          name: ''
        }))
      )
      hasInit.current = true
    }
  }, [defaultFileList])

  const handleRemove = async (file: UploadFile) => {
    await onImageRemove?.(file, fileList)
    return true
  }

  // do not open crop
  const beforeCrop: ImgCropProps['beforeCrop'] = file => {
    if (noNeedCrop) {
      return false
    }

    if (!checkFileSize(file)) {
      return false
    }
    return true
  }

  const beforeUpload: UploadProps['beforeUpload'] = file => {
    // 大小校验
    if (!checkFileSize(file)) {
      message.error(UPLOAD_TOAST_MESSAGE.IMAGE_SIZE_TOO_LARGE)
      return Upload.LIST_IGNORE
    }

    return true
  }

  //TODO 预览的时候ANTD用的是写死的1：1，需要改成传入的 aspect

  const customUploadRequest: UploadProps['customRequest'] = async ({
    file,
    onSuccess,
    onError
  }) => {
    try {
      const response = await uploadFileWithPresigned(file as File, {
        path: `m/${modelId}/images`,
        onProgress: (progress: number) => {
          console.log('progress: ', progress, file)
        }
      })

      if (!response?.success) {
        throw new Error(response?.error || 'upload to server error')
      }

      const newFileList = fileList.map(f =>
        f.uid === (file as UploadFile).uid
          ? {
              ...f,
              response,
              status: 'done',
              thumbUrl: getFileLink(response?.key)
            }
          : f
      )
      setFileList(newFileList)
      onImageUpload(newFileList)
    } catch (err) {
      console.error('upload to server error: ', err)
      const newFileList = fileList.map(f =>
        f.uid === (file as UploadFile).uid
          ? {
              ...f,
              status: 'done',
              thumbUrl: ''
            }
          : f
      )
      setFileList(newFileList)
      onImageUpload(newFileList)
    }
  }

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string
    if (!src) {
      src = await new Promise(resolve => {
        const reader = new FileReader()
        reader.readAsDataURL(file.originFileObj as FileType)
        reader.onload = () => resolve(reader.result as string)
      })
    }
    const image = new Image()
    image.src = src
    const imgWindow = window.open(src)
    imgWindow?.document.write(image.outerHTML)
  }

  const onChange: UploadProps['onChange'] = ({
    file,
    fileList: newFileList
  }) => {
    setFileList(newFileList)
  }

  return (
    <ImgCrop
      showGrid
      rotationSlider
      aspectSlider
      showReset
      aspect={aspect}
      quality={1}
      beforeCrop={beforeCrop}
    >
      <Upload
        customRequest={customUploadRequest}
        accept={UPLOAD_FILE_TYPE.IMAGE}
        listType="picture-card"
        fileList={fileList}
        beforeUpload={beforeUpload}
        onChange={onChange}
        onPreview={onPreview}
        className={`m-ant-upload-wrapper ${className}`}
        onRemove={handleRemove}
      >
        {fileList.length < maxCount && icon}
      </Upload>
    </ImgCrop>
  )
})
