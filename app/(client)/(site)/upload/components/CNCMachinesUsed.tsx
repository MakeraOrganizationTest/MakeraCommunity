import { useWatch } from 'antd/es/form/Form'
import { useEffect } from 'react'
import { Form, Input, Radio } from 'antd'
import { FIELD_TYPE } from '@/constants/upload'

export default function CNCMachinesUsed({ form }: { form: any }) {
  // 监听表单 cncMachinesUsed 字段
  const id = useWatch([FIELD_TYPE.PROJECT, 'machines_used', 'id'], form)

  // 切换时清空name
  useEffect(() => {
    if (id === 'machine-uuid') {
      form.setFieldValue(
        [FIELD_TYPE.PROJECT, 'machines_used', 'name'],
        undefined
      )
    }
  }, [id, form])

  return (
    <div className="flex flex-col">
      <Form.Item
        name={[FIELD_TYPE.PROJECT, 'machines_used', 'id']}
        rules={[{ required: true, message: 'Please select machine' }]}
      >
        <Radio.Group
          options={[
            { value: 'machine-uuid', label: 'Makera' },
            { value: 'other', label: 'Other' }
          ]}
        />
      </Form.Item>
      {id === 'other' && (
        <Form.Item
          name={[FIELD_TYPE.PROJECT, 'machines_used', 'name']}
          label=""
          validateDebounce={600}
          rules={[{ required: true, message: 'Please input machine name' }]}
        >
          <Input placeholder="Please input machine name" allowClear />
        </Form.Item>
      )}
    </div>
  )
}
