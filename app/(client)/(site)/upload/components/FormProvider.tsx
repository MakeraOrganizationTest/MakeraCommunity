'use client'
import { Form, Input, Button, theme, App } from 'antd'
import { useRouter, usePathname, useParams } from 'next/navigation'
import {
  useState,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from 'react'
import { useDebounceFn } from 'ahooks'
import { FIELD_TYPE } from '@/constants/upload'
import {
  transformParamsData,
  transformResponseData
} from '../utils/transformData'
import { MIconCloud } from '@/components/icons'
import { createProject, getProjectInfo } from '@/api/client/project'

export const FormWrapperContext = createContext<any>({})
export const ModeContext = createContext<{
  modeId: string
  currentStep: string
}>({ modeId: '', currentStep: '' })
export const FormErrorContext = createContext<{
  registerFormErrorHandler?: (cb: (fields: any[]) => void) => void
}>({})

/**
 * 解析变动字段路径，返回一维数组
 * @param obj 变动字段
 * @returns 一维数组，包含第一级和第二级
 *
 * // 第一级
 * project: {
 *  // 第二级
 *  machines_used: {
 *    // 第三级
 *    id: '123'
 *  }
 * }
 */
function getChangedFieldPath(obj: any) {
  const res: any[] = []
  const keys = Object.keys(obj)

  // 第一级
  const firstLevelKey = keys[0]
  if (!firstLevelKey) return []
  res[0] = firstLevelKey

  // 第二级
  const secondLevel = obj[firstLevelKey]
  if (!secondLevel) return res

  const secondLevelKeys = Object.keys(secondLevel)

  // 如果更新的是数组。 注意：删除的时候， secondLevelKeys 是空
  if (Array.isArray(secondLevel)) {
    res[1] = []

    secondLevel.forEach((item: any, index) => {
      // 如果是文件更新，已上传的文件有id，无id的则是本次待上传的，要更新的index
      if (!item.id && item?.status === 'done') {
        res[1].push(index)

        // 第三级
        //  如果是其他字段更新
      } else if (Object.keys(item).length === 1) {
        res[1].push(index)
      }
    })
  } else {
    const secondLevelKey = secondLevelKeys[0]
    res[1] = secondLevelKey
  }

  return res
}

export default function FormProvider({
  children,
  modeId,
  currentStep
}: {
  children: React.ReactNode
  modeId: string
  currentStep: string
}) {
  const { message } = App.useApp()
  const router = useRouter()
  const [form] = Form.useForm()
  const [isFormDisabled, setIsFormDisabled] = useState(false)
  const formErrorHandlerRef = useRef<null | ((fields: any[]) => void)>(null)
  const registerFormErrorHandler = useCallback(
    (cb: (fields: any[]) => void) => {
      formErrorHandlerRef.current = cb
    },
    []
  )
  const contextValue = useMemo(
    () => ({ registerFormErrorHandler }),
    [registerFormErrorHandler]
  )

  // =========================== fom =============================

  // 初始值
  const defaultFormValues = {
    projectId: '',
    files: [],
    original_files: [],
    attachments: [],
    gallery: [],
    cover_web: '',
    cover_mobile: '',
    project: {
      name: '',
      description: '',
      creation_type: '',
      derivative_sources: [],
      // other_parts: [
      //   {
      //     name: '', // 默认展示一个
      //     remark: ''
      //   }
      // ],
      machines_used: {},
      category: [],
      tags: []
    }
  }

  // 编辑状态初始值
  useEffect(() => {
    console.log('page & modeId : ', currentStep || 'step1', modeId)
    if (!modeId) {
      form.setFieldsValue(defaultFormValues)
      return
    }
    const fetchInitialValues = async () => {
      setIsFormDisabled(true)
      try {
        const res: any = await getProjectInfo(modeId as string)
        const {
          files = [],
          CAMDragger = [],
          original_files = [],
          ModelDragger = [],
          attachments = [],
          machines_used = {},
          ...project
        } = res.data || {}

        const formValues = {
          projectId: modeId,
          project: {
            ...project,
            category_id: project?.categories?.map((c: any) => c.id),
            tag_ids: project?.tags?.map((t: any) => t.id), // Cascader默认值必须传数组
            machines_used: {
              id: machines_used?.id || 'other',
              name: machines_used?.name
            }
          },
          files: files?.map((file: any) => {
            return {
              id: file?.id,
              response: {
                name: file?.name,
                size: file?.file_size,
                type: file?.file_type,
                key: file?.file_path,
                success: true,
                status: 'done'
              },
              thumbnail: file?.thumbnail,
              cutters: file?.cutters,
              blank: file?.blank
            }
          }),
          original_files: original_files?.map((file: any) => {
            return {
              id: file?.id,
              response: {
                name: file?.name,
                size: file?.file_size,
                type: file?.file_type,
                key: file?.file_path,
                success: true,
                status: 'done'
              }
            }
          }),
          attachments: attachments?.map((file: any) => {
            return {
              id: file?.id,
              response: {
                name: file?.name,
                size: file?.file_size,
                type: file?.file_type,
                key: file?.file_path,
                success: true,
                status: 'done'
              }
            }
          })
        }
        console.log('init form values: ', formValues)
        form.setFieldsValue(formValues)
        setIsFormDisabled(false)
      } catch (error) {
        console.error('init form values error: ', error)
        form.setFieldsValue(defaultFormValues)
        setIsFormDisabled(false)
      }
    }

    fetchInitialValues()
  }, [modeId, form])

  // 自动保存，保存整个模块，而不是单个字段
  // 比如：project > machines_used > id， 保存 machines_used 模块
  const [isSaving, setIsSaving] = useState(false)

  // ============  自动保存  ============
  // @changedValues: 对象，变动字段， 如：{project: {machines_used: {id}}}
  // @allValues: 对象，所有字段
  const onValuesChange = async (changedValues: any, allValues: any) => {
    console.log('===== onValuesChange: ', changedValues, allValues)

    if (isSaving) return

    // 提取变动字段路径
    const changedFieldPath = getChangedFieldPath(changedValues)
    const firstLevelKey = changedFieldPath[0] as FIELD_TYPE
    const _secondLevelKey = changedFieldPath[1] as string | number[]
    const secondLevelKeys = Array.isArray(_secondLevelKey)
      ? _secondLevelKey
      : [_secondLevelKey]

    console.log('save:', changedFieldPath, firstLevelKey, secondLevelKeys)
    // return
    try {
      // 指定字段校验，失败会throw error
      await form.validateFields(
        [
          [
            firstLevelKey as string | number,
            ...(secondLevelKeys.length === 1 ? [secondLevelKeys[0]] : []) // 如果数组里只有一项更新了，则只校验这一项，否则校验整个数组
          ]
        ],
        { recursive: true }
      )

      const newAllValues = {
        ...allValues
      }

      // 判断 projectId 是否存在，不存在则创建
      if (!allValues.projectId) {
        const res = await createProject({
          name: ''
        })
        newAllValues.projectId = res.data?.id
        form.setFieldsValue({ projectId: res.data?.id })
      }

      const services = transformParamsData(
        firstLevelKey,
        secondLevelKeys,
        newAllValues
      )

      setIsSaving(true)

      const respArr = await services()
      console.log('respArr: ', respArr)
      if (respArr.length === 0) {
        setIsSaving(false)
        console.log('No data to update')
        return
      } else {
        console.log(`save ${firstLevelKey} success`)
      }

      respArr.map((res: any, index: number) => {
        const secondLevelKey = secondLevelKeys[index]
        const formatedData = transformResponseData(
          res.data,
          firstLevelKey,
          secondLevelKey,
          newAllValues
        )

        // console.log(
        //   '===== update form Data =====',
        //   firstLevelKey,
        //   secondLevelKey,
        //   formatedData
        // )

        // 基本信息指定key更新，比如 project > machines_used > id， 则更新machines_used模块
        // if (firstLevelKey === FIELD_TYPE.PROJECT) {
        //   form.setFieldsValue({
        //     [firstLevelKey]: {
        //       [secondLevelKey]: formatedData[secondLevelKey]
        //     }
        //   })

        //   console.log(
        //     `save ${firstLevelKey} / ${secondLevelKey} success`,
        //     formatedData[secondLevelKey]
        //   )

        //   // 单独接口 files:[]， original_files:[]，attachments:[] 都是数组，指定index 更新
        // } else {

        // 文件上传相关的需要将返回的id更新到form中, 其他字段不需要
        if (firstLevelKey !== FIELD_TYPE.PROJECT) {
          const arr = form.getFieldValue(firstLevelKey) || []
          const idx = Number(secondLevelKey)
          const newArr = arr?.map((item: any, i: number) =>
            i === idx ? { ...formatedData } : item
          )
          form.setFieldsValue({
            [firstLevelKey]: newArr
          })

          console.log(`save ${firstLevelKey} success: `, newArr)
        }
      })

      setIsSaving(false)
    } catch (err) {
      // 校验不通过
      console.log('valid or submit error: ', err)
      setIsSaving(false)
    }
  }

  // 防抖
  const { run: handleDebouncedValuesChange } = useDebounceFn(
    async (changedValues, allValues) => {
      await onValuesChange(changedValues, allValues)
    },
    { wait: 400 }
  )

  // ============  各类按钮 事件  ============
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSavingNextStep, setIsSavingNextStep] = useState(false)
  const [isSavingSubmit, setIsSavingSubmit] = useState(false)

  // save draft
  const validateForm = async () => {
    try {
      await form.validateFields()
      return true
    } catch (error: any) {
      if (error && error.errorFields) {
        if (formErrorHandlerRef.current) {
          formErrorHandlerRef.current(error.errorFields)
        }
      }
      return false
    }
  }

  const onFinish = (values: any) => {
    console.log('form finished', values)
  }

  // save draft
  const handleSaveDraft = async () => {
    console.log('save draft values: ', form.getFieldsValue())
    setIsSavingDraft(true)
    const isValid = await validateForm()
    if (isValid) {
      setTimeout(() => {
        message.success('Save draft success')
        setIsSavingDraft(false)
      }, 500)
    } else {
      setIsSavingDraft(false)
    }
  }

  // next step
  const handleNextStep = async () => {
    setIsSavingNextStep(true)
    const isValid = await validateForm()
    const id = modeId || form.getFieldValue('projectId')
    if (isValid && id) {
      router.push(`/draft/${id}/step2`)
      setIsSavingNextStep(false)
    } else {
      setIsSavingNextStep(false)
    }
  }

  const handlePrevious = () => {
    router.push(`/draft/${modeId}`)
  }

  const handleSubmit = async () => {
    setIsSavingSubmit(true)
    const isValid = await validateForm()
    const id = modeId || form.getFieldValue('projectId')
    if (isValid && id) {
      router.push(`/models/${id}`)
      setIsSavingSubmit(false)
    } else {
      setIsSavingSubmit(false)
    }
  }

  // const modeContextValue = useMemo(
  //   () => ({ modeId, currentStep }),
  //   [modeId, currentStep]
  // )

  return (
    <FormErrorContext.Provider value={contextValue}>
      <FormWrapperContext.Provider value={{ form, onValuesChange }}>
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          disabled={isFormDisabled}
          scrollToFirstError={{
            behavior: 'instant',
            block: 'end',
            focus: true
          }}
          onValuesChange={handleDebouncedValuesChange}
        >
          <div className="hidden">
            <Form.Item name="projectId" noStyle>
              <Input />
            </Form.Item>
          </div>
          <div className="mx-auto my-8">{children}</div>
          <div className="fixed right-0 bottom-0 left-0 flex w-full items-center justify-center gap-4 bg-white p-4 py-4 shadow-lg">
            {currentStep === 'step2' && (
              <Button
                type="primary"
                htmlType="button"
                variant="outlined"
                color="default"
                onClick={handlePrevious}
              >
                ← Previous
              </Button>
            )}
            <Button
              type="primary"
              htmlType="button"
              variant="outlined"
              color="default"
              onClick={handleSaveDraft}
              loading={isSavingDraft}
              disabled={isSavingDraft}
              icon={<MIconCloud />}
            >
              Save Draft
            </Button>

            {currentStep !== 'step2' ? (
              <Button
                type="primary"
                htmlType="button"
                color="default"
                variant="solid"
                loading={isSavingNextStep}
                disabled={isSavingNextStep}
                onClick={handleNextStep}
              >
                Next Step →
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="button"
                color="default"
                variant="solid"
                loading={isSavingSubmit}
                disabled={isSavingSubmit}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            )}
          </div>
        </Form>
      </FormWrapperContext.Provider>
    </FormErrorContext.Provider>
  )
}
