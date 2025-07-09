import {
  Button,
  Cascader,
  Form,
  Input,
  Radio,
  Select,
  Progress,
  App
} from 'antd'
import type { FormInstance } from 'antd'
import { SimpleEditor } from '@client/components/editor'
import { MIconDelete, MIconSuccess, MIconFailure } from '@/components/icons'
import { FIELD_TYPE } from '@/constants/upload'
import { getProjectCategoriesTree, getProjectTags } from '@/api/client/project'
import { useEffect, useState } from 'react'
import { ProjectTag, ProjectCategoryNode } from '@/types/project'
import { getFileLink } from '@/lib/link'
import { isImageFile } from '@/lib/file'
import { deleteProjectAttachment } from '@/api/client/attachment'
import UploadMultipleFiles from './UploadMultipleFiles'

export default function WorkInfo({
  form,
  onValuesChange
}: {
  form: FormInstance
  onValuesChange: (changedFields: any, allFields: any) => void
}) {
  const { message, modal } = App.useApp()
  const [categories, setCategories] = useState<ProjectCategoryNode[]>([])
  const [tags, setTags] = useState<ProjectTag[]>([])

  const fetchCategories = async () => {
    try {
      const response = await getProjectCategoriesTree()
      if (response.success) {
        setCategories(response.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await getProjectTags()
      if (response.success) {
        setTags(response.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  useEffect(() => {
    // 获取分类数据和标签数据
    fetchCategories()
    fetchTags()
  }, [])

  // ========== description ==========
  // 默认值
  const defaultDescription = form.getFieldValue(FIELD_TYPE.PROJECT)?.description

  const handleDescriptionUpdate = (html: string) => {
    // console.log('description: ', html)
    form.setFieldsValue({
      [FIELD_TYPE.PROJECT]: {
        description: html
      }
    })
    onValuesChange(
      { [FIELD_TYPE.PROJECT]: { description: '' } },
      {
        ...form.getFieldsValue(),
        [FIELD_TYPE.PROJECT]: {
          description: html
        }
      }
    )
  }

  // ========== attachments ==========
  // const attachments = useWatch(FIELD_TYPE.ATTACHMENTS, form) || []

  // 删除文件
  const handleFileRemove = async (id: string, callback: () => void) => {
    await modal.confirm({
      title: 'Delete the attachment',
      content: 'Are you sure you want to delete this file?',
      closable: true,
      onOk: async () => {
        if (id) {
          await deleteProjectAttachment(id)
        }
        callback?.()
      }
    })
  }

  return (
    <>
      <Form.Item
        label={<strong>Work title</strong>}
        name={[FIELD_TYPE.PROJECT, 'name']}
        validateDebounce={600}
        rules={[{ required: true, message: 'Please input your work title!' }]}
      >
        <Input showCount maxLength={50} />
      </Form.Item>

      <Form.Item
        label="Category"
        name={[FIELD_TYPE.PROJECT, 'category_id']}
        rules={[{ required: true, message: 'Please select a category!' }]}
      >
        <Cascader
          fieldNames={{ label: 'name', value: 'id', children: 'children' }}
          options={categories}
          placeholder="Please select category"
          className="!w-full"
          expandTrigger="hover"
        />
      </Form.Item>

      <Form.Item
        label="Tag"
        name={[FIELD_TYPE.PROJECT, 'tag_ids']}
        rules={[{ required: true, message: 'Please select at least one tag!' }]}
      >
        <Select
          mode="multiple"
          allowClear
          fieldNames={{ label: 'name', value: 'id' }}
          placeholder="Please select tags"
          options={tags}
          className="!w-full"
        />
      </Form.Item>

      {/* license */}
      <div className="flex flex-col gap-2">
        <div className="mb-2">
          <span className="mr-1 font-bold text-red-500">*</span>
          <span className="font-bold">License</span>
        </div>
        <div className="rounded-sm border p-4">
          <Form.Item label="Allow sharing of adaptations of your work?">
            <Radio.Group>
              <Radio value="apple">Yes</Radio>
              <Radio value="pear">No</Radio>
              <Radio value="pear">
                Yes, as long as others share in the same way
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Allow commercial use of your work?">
            <Radio.Group>
              <Radio value="apple">Yes</Radio>
              <Radio value="pear">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Allow sharing without attribution?">
            <Radio.Group>
              <Radio value="apple">Yes</Radio>
              <Radio value="pear">No</Radio>
            </Radio.Group>
          </Form.Item>

          <div className="rounded-sm bg-[#F4F7FA] p-5">
            <img src="/images/license.png" alt="license" width={100} />
            <p className="mt-2 text-xs text-muted-foreground">
              This license allows reusers to distribute, remix, adapt, and build
              upon the material in any medium or format, so long as attribution
              is given to the creator. The license allows for commercial use. If
              you remix, adapt, or build upon the material, you must license the
              modified material under identical terms.
            </p>
          </div>
        </div>
      </div>

      {/* description */}
      <div className="mt-6 flex flex-col gap-2">
        <div className="mb-2">
          <span className="mr-1 font-bold text-red-500">*</span>
          <span className="font-bold">description</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Please describe your creation in the input box so that other users can
          better understand and use it.
        </p>
        <div className="rounded-sm border p-4">
          <Form.Item name={[FIELD_TYPE.PROJECT, 'description']} noStyle>
            <SimpleEditor
              content={defaultDescription}
              onUpdate={handleDescriptionUpdate}
            />
          </Form.Item>
        </div>
      </div>

      <div className="w-full">
        <Form.List name={[FIELD_TYPE.ATTACHMENTS]}>
          {(fields, { remove: removeWholeFile }) => {
            const files = form.getFieldValue(FIELD_TYPE.ATTACHMENTS) || []
            return (
              <>
                {fields.map((field, index) => {
                  const file = files[index]
                  if (!file) return null

                  const progress = file?.progress || 0
                  const {
                    fileName = '',
                    size = 0,
                    status = 'uploading', // 上传中的 file.response 是undefined
                    key,
                    success,
                    type = ''
                  } = file?.response || {}

                  const url = type.includes('image') ? key : ''

                  return (
                    <Form.Item key={index} shouldUpdate noStyle>
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="rounded-lg border bg-white p-6">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="flex items-start gap-2">
                              {success ? (
                                <>
                                  <MIconSuccess />
                                  <span className="font-bold text-green-600">
                                    Upload completed
                                  </span>
                                </>
                              ) : status === 'uploading' ? (
                                <span className="font-bold text-blue-500">
                                  Uploading
                                </span>
                              ) : (
                                <>
                                  <MIconFailure />
                                  <span className="font-bold text-[#FF5A6B]">
                                    Upload failed
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex flex-1 items-center justify-end gap-2">
                              {status === 'error' ? (
                                <Button
                                  type="primary"
                                  className="w-20 !text-xs"
                                  size="small"
                                >
                                  Re-upload
                                </Button>
                              ) : (
                                <Button
                                  icon={<MIconDelete />}
                                  type="text"
                                  onClick={() => {
                                    handleFileRemove(file.id, () => {
                                      removeWholeFile(field.name)
                                    })
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          <div className="mb-4 flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                            <div className="h-[75px] w-[100px] overflow-hidden rounded-lg border">
                              {url && isImageFile(url) ? (
                                <img
                                  src={getFileLink(url) || ''}
                                  className="h-full w-full rounded-lg object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="flex w-full flex-1 flex-col items-start justify-start">
                              <div className="mb-0.5 font-semibold">
                                {fileName}
                              </div>
                              {progress && progress > 0 && progress < 100 ? (
                                <Progress
                                  percent={progress}
                                  type="line"
                                  percentPosition={{
                                    align: 'end',
                                    type: 'outer'
                                  }}
                                  strokeColor="#1777FC"
                                  className="w-full !text-xs"
                                  size={{ height: 4 }}
                                />
                              ) : null}
                              <div className="mt-1 text-xs text-gray-400">
                                {size &&
                                  `${(size / 1024 / 1024).toFixed(2)} MB`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Form.Item>
                  )
                })}
              </>
            )
          }}
        </Form.List>
      </div>

      <div className="mt-6 flex justify-start">
        <UploadMultipleFiles
          FormItemName={FIELD_TYPE.ATTACHMENTS}
          form={form}
          staticPath="work/attachments"
          maxCount={2}
          multiple={false}
          customUI={
            <div className="flex w-full items-center justify-start">
              <Button type="default" variant="outlined" className="text-sm">
                + Add attachment
              </Button>
            </div>
          }
        />
      </div>
    </>
  )
}
