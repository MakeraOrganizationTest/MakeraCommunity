import React from 'react'
import type { CascaderProps } from 'antd'
import { Cascader } from 'antd'

export default function MCascader({
  value,
  defaultValue,
  options,
  popupRender,
  onChange
}: {
  value?: string[]
  defaultValue?: string[]
  options: any[]
  popupRender?: (menus: React.ReactElement) => React.ReactElement
  onChange?: (value: string[]) => void
}) {
  return (
    <Cascader
      value={value}
      fieldNames={{ label: 'name', value: 'id' }}
      defaultValue={defaultValue}
      options={options}
      onChange={onChange}
      className="!mb-2 !w-full"
      popupRender={popupRender}
    />
  )
}
