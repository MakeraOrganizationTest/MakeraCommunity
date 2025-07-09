'use client'
import { Collapse, CollapseProps, Form, theme } from 'antd'
import { DownOutlined, FileOutlined } from '@ant-design/icons'
import RightSidebar from '../../../upload/components/RightSidebar'
import { CSSProperties, useContext, useState } from 'react'
import UploadSteps from '../../../upload/components/UploadSteps'
import { useRouter } from 'next/navigation'
import { FormWrapperContext } from '../../../upload/components/FormProvider'
import AddImages from '../../../upload/components/AddImages'
import WorkInfo from '../../../upload/components/WorkInfo'
import { FIELD_TYPE } from '@/constants/upload'

export default function UploadStep2Content() {
  const { form, onValuesChange } = useContext(FormWrapperContext)

  // 自定义组件需要手动触发form的onValuesChange
  const handleValuesChange = (changedFields: any, allFields: any) => {
    onValuesChange(changedFields, allFields)
  }

  // =============== Collapse =================
  const getItems: (
    panelStyle: CSSProperties
  ) => CollapseProps['items'] = panelStyle => [
    {
      key: '1',
      label: (
        <div className="flex items-center text-lg font-semibold">
          <span className="mr-2 box-border pt-1 text-red-500">*</span>
          <span>Add images</span>
        </div>
      ),
      forceRender: true, // 强制渲染，否则 Form 获取隐藏collapse的值
      children: <AddImages form={form} onValuesChange={handleValuesChange} />,
      style: panelStyle
    },
    {
      key: '2',
      forceRender: true,
      label: (
        <div className="flex items-center text-lg font-semibold">
          <span>Work information</span>
        </div>
      ),
      children: <WorkInfo form={form} onValuesChange={handleValuesChange} />,
      style: panelStyle
    }
  ]

  const { token } = theme.useToken()

  const panelStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
    background: token.colorBgContainer,
    borderRadius: token.borderRadiusLG,
    padding: '1rem 0.875rem',
    border: 'none'
  }

  return (
    <>
      {/* 隐藏的 Form.Item，用于保存第一步的数据，用于展示 RightSidebar */}
      <div className="hidden">
        <Form.Item name={FIELD_TYPE.FILES} noStyle />
        <Form.Item name={FIELD_TYPE.ORIGINAL_FILES} noStyle />
        <Form.Item name={[FIELD_TYPE.PROJECT, 'machines_used']} noStyle />
        <Form.Item name={[FIELD_TYPE.PROJECT, 'other_parts']} noStyle />
      </div>
      <div className="mx-auto mb-8 grid min-h-screen w-[1440px] grid-cols-[1fr_338px]">
        <div className="mr-8 min-h-full flex-1">
          <div className="mb-8 rounded-lg bg-white p-[1.875rem]">
            <UploadSteps currentStep={1} currentStepStatus={'process'} />
          </div>
          <Collapse
            bordered={false}
            defaultActiveKey={['1']}
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
          />
        </div>

        <RightSidebar />
      </div>
    </>
  )
}
