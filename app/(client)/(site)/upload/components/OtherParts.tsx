import { MIconDelete, MIconPlusOutlined } from '@/components/icons'
import { Form, Input, Button, App } from 'antd'
import { FIELD_TYPE } from '@/constants/upload'

export default function AddOtherParts({ form }: { form?: any }) {
  const { message } = App.useApp()
  return (
    <Form.List
      name={[FIELD_TYPE.PROJECT, 'other_parts']}
      rules={[
        {
          validator: async (_, names) => {
            if (names && names.length > 3) {
              return Promise.reject(new Error('You can only add up to 3 parts'))
            }
          }
        }
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <div className="flex flex-col">
          {fields.map((field, index) => {
            const { key, ...restField } = field
            return (
              <div key={String(key)} className="mb-4">
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="grid w-full flex-1 grid-cols-2 gap-4">
                    <Form.Item
                      {...restField}
                      name={[field.name, 'name']}
                      label={<strong>Parts name</strong>}
                      className="!mb-0 w-full"
                      rules={[
                        { required: true, message: 'Please input parts name' }
                      ]}
                    >
                      <Input placeholder="Please select blank" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[field.name, 'remark']}
                      label={<strong>Remark</strong>}
                      className="!mb-0 w-full"
                    >
                      <Input placeholder="Please input remark" />
                    </Form.Item>
                  </div>
                  <div className="mt-8">
                    <Button
                      type="text"
                      icon={<MIconDelete />}
                      onClick={() => remove(field.name)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          <Form.Item>
            <div
              className="flex w-full flex-col items-start justify-start gap-2"
              onClick={() => {
                if (fields.length >= 3) {
                  message.warning('Maximum 3 parts are allowed')
                  return
                }
                add()
              }}
            >
              <MIconPlusOutlined />
            </div>
          </Form.Item>
        </div>
      )}
    </Form.List>
  )
}
