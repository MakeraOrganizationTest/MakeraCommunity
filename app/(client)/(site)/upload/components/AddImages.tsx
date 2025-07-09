import { MIconImage, MIconPlus } from '@/components/icons'
import UploadAndCrop from './UploadAndCrop'
import { App, Form, FormInstance, UploadFile } from 'antd'
import { UploadFileResponse } from '@/types/upload'
import { FIELD_TYPE, UPLOAD_BASE_URL } from '@/constants/upload'
import { updateProject } from '@/api/client/project'
import { useWatch } from 'antd/es/form/Form'

export default function AddImages({
  form,
  onValuesChange
}: {
  form: FormInstance
  onValuesChange: (changedFields: any, allFields: any) => void
}) {
  const { message, modal } = App.useApp()

  const handlerUpdateProject = async (
    key: string,
    files: UploadFileResponse[]
  ) => {
    if (files.every(file => file.status === 'done')) {
      const values =
        key === 'gallery'
          ? files.map(file => file.response?.key)
          : files[0]?.response?.key
      const projectId = form.getFieldValue(FIELD_TYPE.PROJECT_ID)
      const res: any = await updateProject({
        id: projectId as string,
        [key]: values
      })
    }
  }

  // 从 Form 获取默认值，必须要加 Form.Item，否则获取不到
  const defaultCoverWeb = useWatch([FIELD_TYPE.PROJECT, 'cover_web'], form)
  const defaultCoverMobile = useWatch(
    [FIELD_TYPE.PROJECT, 'cover_mobile'],
    form
  )
  const defaultGallery = useWatch([FIELD_TYPE.PROJECT, 'gallery'], form)

  const handleCoverImageUpload = (files: UploadFileResponse[]) => {
    handlerUpdateProject('cover_web', files)
  }
  const handleMobileImageUpload = (files: UploadFileResponse[]) => {
    handlerUpdateProject('cover_mobile', files)
  }

  const handleWorkImagesUpload = (files: UploadFileResponse[]) => {
    handlerUpdateProject('gallery', files)
  }

  const handlerRemoveImageFromServer = async (key: string, value: any) => {
    await modal.confirm({
      title: 'Delete the image',
      content: 'Are you sure you want to delete this image?',
      closable: true,
      onOk: async () => {
        const projectId = form.getFieldValue(FIELD_TYPE.PROJECT_ID)
        await updateProject({
          id: projectId as string,
          [key]: value
        })
      }
    })
  }
  const handleRemoveCoverImage = async (): Promise<boolean> => {
    const value = ''
    await handlerRemoveImageFromServer('cover_web', value)
    return true
  }
  const handleRemoveCoverMobileImage = async (): Promise<boolean> => {
    const value = ''
    await handlerRemoveImageFromServer('cover_mobile', value)
    return true
  }
  const handleRemoveWorkImages = async (
    file: UploadFile,
    files: UploadFile[]
  ): Promise<boolean> => {
    const value = files.filter(f => f.url !== file.url).map(f => f.url)
    await handlerRemoveImageFromServer('gallery', value)
    return true
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Work cover</h3>
      <p className="mb-2 text-xs text-muted-foreground">
        JPG/GIF/PNG, ≤20 MB. Please use real photos
      </p>
      <div className="flex items-start justify-start gap-6">
        <div className="aspect-4/3 w-[300px] overflow-hidden rounded-lg border-2 border-dashed border-[#CDDAE7]">
          <Form.Item name={[FIELD_TYPE.PROJECT, 'cover_web']} noStyle>
            <UploadAndCrop
              modelId="cam-files"
              icon={<MIconImage className="h-9 w-9" />}
              onImageUpload={handleCoverImageUpload}
              onImageRemove={handleRemoveCoverImage}
              defaultFileList={
                defaultCoverWeb
                  ? [{ url: `${UPLOAD_BASE_URL}/${defaultCoverWeb}` }]
                  : []
              }
            />
          </Form.Item>
        </div>
        <div className="aspect-3/4 h-[225px] overflow-hidden rounded-lg border-2 border-dashed border-[#CDDAE7]">
          <Form.Item name={[FIELD_TYPE.PROJECT, 'cover_mobile']} noStyle>
            <UploadAndCrop
              aspect={3 / 4}
              modelId="cam-files"
              icon={<MIconImage className="h-9 w-9" />}
              onImageUpload={handleMobileImageUpload}
              onImageRemove={handleRemoveCoverMobileImage}
              defaultFileList={
                defaultCoverMobile
                  ? [{ url: `${UPLOAD_BASE_URL}/${defaultCoverMobile}` }]
                  : []
              }
            />
          </Form.Item>
        </div>
      </div>

      <h3 className="mt-4 text-sm font-semibold">Work images (0/10)</h3>
      <p className="mb-2 text-xs text-muted-foreground">
        JPG/GIF/PNG, ≤20 MB. Please use real photos
      </p>

      <div className="h-[120px] rounded-lg">
        <Form.Item name={[FIELD_TYPE.PROJECT, 'gallery']} noStyle>
          <UploadAndCrop
            modelId="cam-files"
            className="m-upload-work-images"
            icon={<MIconPlus className="h-6 w-6" />}
            maxCount={2}
            noNeedCrop={true}
            onImageUpload={handleWorkImagesUpload}
            onImageRemove={handleRemoveWorkImages}
            defaultFileList={defaultGallery?.map((url: string) => ({
              url: `${UPLOAD_BASE_URL}/${url}`
            }))}
          />
        </Form.Item>
      </div>
    </div>
  )
}
