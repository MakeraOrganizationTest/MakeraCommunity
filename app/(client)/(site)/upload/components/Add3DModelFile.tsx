import { useWatch } from 'antd/es/form/Form'
import { App, Button, Form, Input, Progress, Radio } from 'antd'
import UploadMultipleFiles from './UploadMultipleFiles'
import { UploadFileResponse } from '@/types/upload'
import {
  MIconDelete,
  MIconDeleteSVG,
  MIconFailure,
  MIconSuccess
} from '@/components/icons'
import { FIELD_TYPE } from '@/constants/upload'
import { deleteProjectOriginalFile } from '@/api/client/project'
import { isImageFile } from '@/lib/file'
import { getFileLink } from '@/lib/link'
import { useCallback, useState } from 'react'
import type { UploadFile } from 'antd'
import { FileType } from '@/constants/file'
import { detectFileType } from '@/lib/file'

export default function Add3DModelFile({
  form,
  onModelFilesChange
}: {
  form: any
  onModelFilesChange?: (files: UploadFileResponse[]) => void
}) {
  const { message, modal } = App.useApp()

  // 监听表单 creationType 字段
  const creationType = useWatch([FIELD_TYPE.PROJECT, 'creation_type'], form)

  // 删除文件
  const handleFileRemove = async (id: string, callback: () => void) => {
    await modal.confirm({
      title: 'Delete the 3D model file',
      content: 'Are you sure you want to delete this file?',
      closable: true,
      onOk: async () => {
        if (id) {
          try {
            await deleteProjectOriginalFile(id)
            callback?.()
          } catch (error) {
            console.error('delete original file error: ', error)
          }
        }
      }
    })
  }

  const [filesProgressMap, setFilesProgressMap] = useState<
    Record<string, number>
  >({})

  const customProgress = useCallback((progress: number, file: UploadFile) => {
    console.log('progress: ', progress)
    setFilesProgressMap(prev => ({
      ...prev,
      [file.uid]: progress
    }))
  }, [])

  return (
    <div className="flex flex-col">
      <Form.Item name={[FIELD_TYPE.PROJECT, 'creation_type']} label="">
        <Radio.Group
          options={[
            { value: 'original', label: 'Original' },
            { value: 'derivative', label: 'Second Creation' }
          ]}
        />
      </Form.Item>

      {/* Model source URLs list */}
      {creationType === 'derivative' && (
        <Form.List
          name={[FIELD_TYPE.PROJECT, 'derivative_sources']}
          rules={[
            {
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  return Promise.reject(
                    new Error('Please input at least one URL')
                  )
                } else if (value.length > 3) {
                  return Promise.reject(new Error('Maximum 3 URLs are allowed'))
                }
              }
            }
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field, index) => {
                const { key, ...restField } = field
                return (
                  <div
                    key={String(key)}
                    className="mb-3 flex w-full items-center justify-between overflow-hidden"
                  >
                    <Form.Item
                      {...restField}
                      rules={[
                        { required: true, message: 'Please input a URL' },
                        {
                          type: 'url',
                          message:
                            'Please enter a valid URL (must start with http:// or https://)'
                        }
                      ]}
                      className="!mb-0 flex-1"
                    >
                      <Input
                        placeholder="Paste URL"
                        className="!mb-0 flex-1"
                        suffix={
                          <MIconDeleteSVG
                            className="ml-2"
                            onClick={() => remove(field.name)}
                          />
                        }
                      />
                    </Form.Item>
                  </div>
                )
              })}

              <Form.Item>
                <div className="flex w-full flex-col items-start justify-start gap-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (fields.length >= 3) {
                        message.warning('Maximum 3 URLs are allowed')
                        return
                      }
                      add()
                    }}
                    icon={null}
                  >
                    + Add
                  </Button>
                  <Form.ErrorList errors={errors} />
                </div>
              </Form.Item>
            </>
          )}
        </Form.List>
      )}

      {/* upload 3d model files */}
      <UploadMultipleFiles
        FormItemName={FIELD_TYPE.ORIGINAL_FILES}
        typesInfo="Supported 3D formats: 3ds, amf, blend, dwg, dxf, f3d, f3z, factory, fcstd, iges, ipt, obj, py, rsdoc, scad, sldasm, sldprt, slvs, step, stl, studio3, zip, 3mf, stpz, fcstd"
        title="Drag files here"
        browseFiles={true}
        staticPath="cam-multiple-files"
        maxCount={4}
        form={form}
        customProgress={customProgress}
      />
      <Form.List name={[FIELD_TYPE.ORIGINAL_FILES]}>
        {(fields, { remove: removeWholeFile }) => {
          const files = form.getFieldValue(FIELD_TYPE.ORIGINAL_FILES) || []
          return (
            <>
              {fields.map((field, index) => {
                const file = files[index]
                if (!file) return null

                const { uid, response, size, status } = file
                const { name = '', key, success = false } = response || {}
                const fileName = name || file.name

                const progress =
                  !response && uid ? filesProgressMap[uid] || 0 : 0

                const url = key
                  ? detectFileType(key) === FileType.IMAGE
                    ? key
                    : ''
                  : ''

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
                              <span className="font-bold">Uploading</span>
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
                                alt={fileName}
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
                              {size && `${(size / 1024 / 1024).toFixed(2)} MB`}
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
  )
}
