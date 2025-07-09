import UploadMultipleFiles from './UploadMultipleFiles'
import { UploadFile } from 'antd'
import { useEffect, useState, useCallback } from 'react'
import {
  MIconRefresh,
  MIconDelete,
  MIconSuccess,
  MIconFailure,
  MIconPlusOutlined,
  MIconImage
} from '@/components/icons'
import {
  Button,
  Form,
  Divider,
  Modal,
  Progress,
  Cascader,
  App,
  Input
} from 'antd'
import AddNewToolModal from './AddNewToolModal'
import UploadAndCrop from './UploadAndCrop'
import { UploadFileResponse } from '@/types/upload'
import { getCutterTree } from '@/api/client/cutter'
import { getMaterialTree } from '@/api/client/material'
import { CutterGroupNode, CutterNode, CutterType } from '@/types/cutter'
import { MaterialGroupNode, MaterialNode } from '@/types/material'
import { FIELD_TYPE } from '@/constants/upload'
import { deleteProjectFile } from '@/api/client/project'
import { getFileLink } from '@/lib/link'
import { findNodeById } from '@/lib/tree'

export default function AddCAMFile({
  form,
  onValuesChange
}: {
  form: any
  onValuesChange: (changedFields: any, allFields: any) => void
}) {
  const { message, modal } = App.useApp()

  const [cutterTree, setCutterTree] = useState<
    (CutterGroupNode | CutterNode)[]
  >([])
  const [materialTree, setMaterialTree] = useState<
    (MaterialGroupNode | MaterialNode)[]
  >([])

  const [isAddNewKnifeModalOpen, setIsAddNewKnifeModalOpen] = useState(false)
  const [isAddingKnifeIndex, setIsAddingKnifeIndex] = useState<{
    fileIndex: number
    cutterIndex: number
  } | null>(null)

  const queryCutterTree = async () => {
    try {
      const res = await getCutterTree()
      setCutterTree(
        (res.data || []).concat([
          {
            id: 'customCutter',
            name: 'Custom Cutter',
            children: [],
            order: 0,
            disabled: true
          }
        ])
      )
    } catch (error) {
      console.error(error)
    }
  }
  const queryMaterialTree = async () => {
    try {
      const res = await getMaterialTree()
      setMaterialTree(res.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    queryCutterTree()
    queryMaterialTree()
  }, [])

  // 封面图
  const handleImageUploaded = useCallback(
    (formIndex: number, res: UploadFileResponse[]) => {
      const { response, status } = res[0]
      console.log('cover image uploaded', formIndex, res[0])
      if (status === 'done' && response?.key) {
        form.setFieldValue(
          [FIELD_TYPE.FILES, formIndex, 'thumbnail'],
          response?.key
        )

        onValuesChange(
          {
            [FIELD_TYPE.FILES]: {
              [formIndex]: { thumbnail: '' }
            }
          },
          form.getFieldsValue()
        )
      }
    },
    [form]
  )

  // 添加刀具
  const handleAddNewKnife = (fileIndex: number, cutterIndex: number) => {
    setIsAddingKnifeIndex({ fileIndex, cutterIndex })
    setIsAddNewKnifeModalOpen(true)
  }

  const addNewKnife = useCallback(
    (fileIndex: number, cutterIndex: number) => (menus: React.ReactNode) => (
      <div>
        {menus}
        <div className="flex flex-col items-center justify-start p-2">
          <Divider className="!my-2" />
          <div className="flex w-full items-center justify-start">
            <Button
              type="primary"
              className="!px-10"
              onClick={() => handleAddNewKnife(fileIndex, cutterIndex)}
            >
              Add Tool
            </Button>
          </div>
        </div>
      </div>
    ),
    []
  )

  const onAddNewKnife = useCallback(
    (name: string) => {
      if (isAddingKnifeIndex) {
        const { fileIndex, cutterIndex } = isAddingKnifeIndex
        setIsAddNewKnifeModalOpen(false)

        console.log('2222onAddNewKnife: ', name, fileIndex, cutterIndex)
        form.setFieldValue(
          [FIELD_TYPE.FILES, fileIndex, 'cutters', cutterIndex],
          [
            {
              id: 'customCutter',
              name
            }
          ]
        )
      }
    },
    [form, isAddingKnifeIndex]
  )

  // 删除文件
  const handleFileRemove = async (id: string, callback: () => void) => {
    await modal.confirm({
      title: 'Delete the CAM file',
      content: 'Are you sure you want to delete this file?',
      closable: true,
      onOk: async () => {
        if (id) {
          await deleteProjectFile(id)
        }
        callback?.()
      }
    })
  }

  // reupload
  const handleReupload = useCallback(async (file: UploadFileResponse) => {
    console.log('reupload: ', file)
  }, [])

  // 上传进度
  const [filesProgressMap, setFilesProgressMap] = useState<
    Record<string, number>
  >({})

  const customProgress = useCallback((progress: number, file: UploadFile) => {
    setFilesProgressMap(prev => ({
      ...prev,
      [file.uid]: progress
    }))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <UploadMultipleFiles
        FormItemName={FIELD_TYPE.FILES}
        typesInfo="Supported 3D formats: 3ds, amf, blend, dwg, dxf, f3d, f3z, factory, fcstd, iges, ipt, obj, py, rsdoc, scad, sldasm, sldprt, slvs, step, stl, studio3, zip, 3mf, stpz, fcstd"
        title="Drag files here"
        browseFiles={true}
        staticPath="cam-multiple-files"
        maxCount={5}
        form={form}
        customProgress={customProgress}
      />

      <div className="flex flex-col gap-4">
        <Form.List name={[FIELD_TYPE.FILES]}>
          {(fields, { remove: removeWholeFile }) => {
            const files = form.getFieldValue(FIELD_TYPE.FILES) || []
            return (
              <>
                {fields.map((field, fileIndex) => {
                  const file = files[fileIndex]
                  if (!file) return null

                  const { uid, response, size, status } = file
                  const { name = '', success = false } = response || {}
                  const progress = !response && uid ? filesProgressMap[uid] : 0

                  // 新增文件默认展示一条刀具，有BUG
                  // if (file.response && success && !file.cutters) {
                  //   file.cutters = [[{}]]
                  // }

                  return (
                    <div key={field.key}>
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
                          <div className="h-[75px] w-[100px] overflow-hidden rounded-lg border border-dashed border-gray-200">
                            <UploadAndCrop
                              icon={<MIconImage className="h-6 w-6" />}
                              modelId="cam-files"
                              defaultFileList={
                                file?.thumbnail
                                  ? [
                                      {
                                        url: getFileLink(file?.thumbnail)
                                      }
                                    ]
                                  : []
                              }
                              onImageUpload={res =>
                                handleImageUploaded(fileIndex, res)
                              }
                            />
                          </div>
                          <div className="flex w-full flex-1 flex-col items-start justify-start">
                            <div className="mb-0.5 font-semibold">
                              {isAddingKnifeIndex &&
                              isAddingKnifeIndex.fileIndex === fileIndex &&
                              isAddingKnifeIndex.cutterIndex === 0 ? (
                                <Form.Item
                                  name={[field.name, 'response', 'name']}
                                  className="!mb-0"
                                  rules={[
                                    {
                                      required: true,
                                      message: 'Please enter a new name'
                                    }
                                  ]}
                                >
                                  <Input
                                    autoFocus
                                    size="small"
                                    onBlur={() => setIsAddingKnifeIndex(null)}
                                    onPressEnter={() =>
                                      setIsAddingKnifeIndex(null)
                                    }
                                  />
                                </Form.Item>
                              ) : (
                                <span
                                  onClick={() => {
                                    setIsAddingKnifeIndex({
                                      fileIndex,
                                      cutterIndex: 0
                                    })
                                  }}
                                  className="cursor-pointer"
                                >
                                  {name || file.name}
                                </span>
                              )}
                            </div>
                            {progress > 0 && progress < 100 && (
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
                            )}
                            <div className="mt-1 text-xs text-gray-400">
                              {size && `${(size / 1024 / 1024).toFixed(2)} MB`}
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <span className="mr-1 font-bold text-red-500">*</span>
                          <span className="font-bold">Blank</span>
                        </div>
                        <Form.Item
                          name={[field.name, 'blank']}
                          label=""
                          rules={[
                            {
                              required: true,
                              message: 'Please select a material'
                            }
                          ]}
                          getValueProps={value => ({
                            value: Array.isArray(value)
                              ? value.map(v => v.id)
                              : []
                          })}
                          normalize={value =>
                            value?.map((v: any) =>
                              findNodeById(materialTree, v)
                            )
                          }
                        >
                          <Cascader
                            fieldNames={{ label: 'name', value: 'id' }}
                            options={materialTree}
                            className="!w-full"
                          />
                        </Form.Item>
                        <div className="mt-4 mb-2">
                          <span className="mr-1 text-red-500">*</span>
                          <span className="font-bold">Knives</span>
                        </div>
                        <div className="mb-4">
                          <Form.List
                            name={[field.name, 'cutters']}
                            rules={[
                              {
                                validator: async (_, value) => {
                                  if (
                                    !Array.isArray(value) ||
                                    value.length < 1
                                  ) {
                                    return Promise.reject(
                                      new Error(
                                        'Please select at least one cutter'
                                      )
                                    )
                                  } else if (value.length > 3) {
                                    return Promise.reject(
                                      new Error('Maximum 3 cutters are allowed')
                                    )
                                  }
                                }
                              }
                            ]}
                          >
                            {(fields, { add, remove }, { errors }) => (
                              <>
                                <div className="mb-4 grid w-full grid-cols-2 gap-2">
                                  {fields.map((field, cutterIndex) => {
                                    const { key, ...restField } = field
                                    return (
                                      <div
                                        key={String(key)}
                                        className="flex w-full items-start justify-between overflow-hidden"
                                      >
                                        <Form.Item
                                          {...restField}
                                          className="!mb-0 min-w-0 flex-1 !pr-2"
                                          rules={[
                                            {
                                              required: true,
                                              message: 'Please select a cutter'
                                            }
                                          ]}
                                          getValueProps={value => {
                                            return {
                                              value: Array.isArray(value)
                                                ? value.map(v => v.id)
                                                : []
                                            }
                                          }}
                                          normalize={value => {
                                            return value?.map((v: any) =>
                                              findNodeById(cutterTree, v)
                                            )
                                          }}
                                        >
                                          <Cascader
                                            fieldNames={{
                                              label: 'name',
                                              value: 'id'
                                            }}
                                            options={cutterTree}
                                            popupRender={addNewKnife(
                                              fileIndex,
                                              cutterIndex
                                            )}
                                          />
                                        </Form.Item>
                                        <MIconDelete
                                          onClick={() => remove(field.name)}
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                                <Form.Item>
                                  <div
                                    className="inline-block"
                                    onClick={() => {
                                      if (fields.length >= 3) {
                                        message.warning(
                                          'Maximum 3 cutters are allowed'
                                        )
                                        return
                                      }
                                      add()
                                    }}
                                  >
                                    <MIconPlusOutlined />
                                  </div>
                                  <Form.ErrorList errors={errors} />
                                </Form.Item>
                              </>
                            )}
                          </Form.List>
                        </div>
                      </div>
                      {/* add new tool modal */}
                      <AddNewToolModal
                        fileIndex={
                          isAddingKnifeIndex
                            ? isAddingKnifeIndex.fileIndex
                            : undefined
                        }
                        cutterIndex={
                          isAddingKnifeIndex
                            ? isAddingKnifeIndex.cutterIndex
                            : undefined
                        }
                        isModalOpen={isAddNewKnifeModalOpen}
                        setIsModalOpen={setIsAddNewKnifeModalOpen}
                        onAddNewKnife={onAddNewKnife}
                      />
                      {/* delete tool modal */}
                      <Modal
                        width={520}
                        title={
                          <div className="flex items-center gap-2">
                            <MIconFailure className="h-8 w-8" />
                            <div className="text-xl font-semibold">
                              Delete the original model file
                            </div>
                          </div>
                        }
                      >
                        <div className="mb-10 px-8 text-sm text-secondary">
                          Are you sure you want to delete this file?
                        </div>
                      </Modal>
                    </div>
                  )
                })}
              </>
            )
          }}
        </Form.List>
      </div>
    </div>
  )
}
