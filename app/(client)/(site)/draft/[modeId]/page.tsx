'use client'
import { theme, Collapse } from 'antd'
import RightSidebar from '../../upload/components/RightSidebar'
import UploadSteps from '../../upload/components/UploadSteps'
import {
  CSSProperties,
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react'

import type { CollapseProps } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import AddCAMFiles from '../../upload/components/AddCAMFiles'
import Add3DModelFile from '../../upload/components/Add3DModelFile'
import CNCMachinesUsed from '../../upload/components/CNCMachinesUsed'
import AddOtherParts from '../../upload/components/OtherParts'

import { FIELD_TYPE } from '@/constants/upload'
import {
  FormWrapperContext,
  FormErrorContext
} from '../../upload/components/FormProvider'

export default function UploadContent() {
  // =============== Collapse =================
  const { form, onValuesChange } = useContext(FormWrapperContext)
  const { registerFormErrorHandler } = useContext(FormErrorContext)
  const { token } = theme.useToken()
  const [activeKey, setActiveKey] = useState(['1'])

  // 字段名到Collapse key的映射关系（你可以后续自定义）
  const fieldToPanelKey: Record<string, string> = {
    machines_used: '3',
    other_parts: '4'
  }

  // 错误回调，接收 errorFields，自动展开对应面板
  const handleFormError = useCallback((errorFields: any[]) => {
    if (!errorFields?.length) return
    errorFields.forEach((field: any, index: number) => {
      const key = fieldToPanelKey[field?.name?.[1]]
      if (key) {
        const newActiveKey = Array.from(new Set([...activeKey, key])).filter(
          i => i !== undefined
        )
        console.log('form valid error position: ', field, key, newActiveKey)
        setActiveKey(newActiveKey)
      }
    })
  }, [])

  useEffect(() => {
    if (registerFormErrorHandler) {
      registerFormErrorHandler(handleFormError)
    }
  }, [handleFormError])

  const panelStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
    background: token.colorBgContainer,
    borderRadius: token.borderRadiusLG,
    padding: '1rem 0.875rem',
    border: 'none'
  }

  const getItems: (
    panelStyle: CSSProperties
  ) => CollapseProps['items'] = panelStyle => [
    {
      key: '1',
      label: (
        <div className="flex items-center text-lg font-semibold">
          <span className="mr-2 box-border pt-1 text-destructive">*</span>
          <span>Add CAM Files</span>
        </div>
      ),
      forceRender: true, // 强制渲染，否则 Form 获取隐藏collapse的值
      children: <AddCAMFiles form={form} onValuesChange={onValuesChange} />,
      style: panelStyle
    },
    {
      key: '2',
      label: (
        <div className="flex items-center text-lg font-semibold">
          <span className="mr-2 box-border pt-1 text-destructive">*</span>
          <span>Add 3D Model file</span>
        </div>
      ),
      forceRender: true,
      children: (
        <Add3DModelFile
          form={form}
          onModelFilesChange={files =>
            onValuesChange(
              { [FIELD_TYPE.ORIGINAL_FILES]: files },
              form.getFieldsValue()
            )
          }
        />
      ),
      style: panelStyle
    },
    {
      key: '3',
      label: (
        <div className="flex items-center text-lg font-semibold">
          <span className="mr-2 box-border pt-1 text-destructive">*</span>
          <span>CNC Machines Used</span>
        </div>
      ),
      forceRender: true,
      children: <CNCMachinesUsed form={form} />,
      style: panelStyle
    },
    {
      key: '4',
      label: (
        <div className="flex items-center text-lg font-semibold">
          <span>Other parts</span>
        </div>
      ),
      forceRender: true,
      children: <AddOtherParts form={form} />,
      style: panelStyle
    }
  ]

  return (
    <div className="mx-auto mb-8 grid min-h-screen w-[1440px] grid-cols-[1fr_338px]">
      <div className="mr-8 min-h-full">
        <div className="mb-8 rounded-lg bg-white p-[1.875rem]">
          <UploadSteps currentStep={0} currentStepStatus="process" />
        </div>
        <Collapse
          bordered={false}
          activeKey={activeKey}
          expandIcon={({ isActive }) => (
            <DownOutlined
              className={`transition-transform duration-300 ease-in-out ${
                isActive ? 'rotate-180' : 'rotate-0'
              }`}
            />
          )}
          expandIconPosition="end"
          style={{ background: 'transparent' }}
          items={getItems(panelStyle)}
          onChange={setActiveKey}
        />
      </div>

      <RightSidebar />
    </div>
  )
}
