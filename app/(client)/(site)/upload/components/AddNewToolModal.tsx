import { Modal, Form, Input, Select } from 'antd'
import { useEffect, useState } from 'react'
import { getCutterTypes } from '@/api/client/cutter'
import { CutterType } from '@/types/cutter'

export default function AddNewToolModal({
  fileIndex,
  cutterIndex,
  isModalOpen,
  setIsModalOpen,
  onAddNewKnife
}: {
  fileIndex?: number
  cutterIndex?: number
  isModalOpen: boolean
  setIsModalOpen: (isModalOpen: boolean) => void
  onAddNewKnife: (name: string) => void
}) {
  const [form] = Form.useForm()
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleOk = () => {
    form.submit()
  }

  const onFinish = async (values: CutterType) => {
    await form.validateFields().then(() => {
      onAddNewKnife(values.name)
    })
  }

  return (
    <Modal
      width={520}
      title="Add New Tool"
      okText="Confirm"
      cancelText="Cancel"
      closable={true}
      open={isModalOpen}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={() => setIsModalOpen(false)}
    >
      <p className="mb-8 text-xs text-muted-foreground">
        Please describe your tool parameters clearly
      </p>
      <Form
        form={form}
        name="basic"
        layout="vertical"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item<CutterType>
          label={<span className="font-bold">Tool Name</span>}
          name="name"
          layout="vertical"
          wrapperCol={{ span: 24 }}
          rules={[
            { required: true, message: 'Please input a tool name!' },
            { min: 5, message: 'At least 5 characters!' },
            {
              pattern: /^[A-Za-z0-9]+$/,
              message: 'Only letters and numbers allowed!'
            }
          ]}
        >
          <Input placeholder="Please input tool name" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
