import { Collapse } from 'antd'
import { CloseOutlined, UpOutlined } from '@ant-design/icons'
import { MIconInfo } from '@/components/icons'
import '../upload.css'
import { FormWrapperContext } from './FormProvider'
import { useContext, useEffect, useState } from 'react'
import { useWatch } from 'antd/es/form/Form'
import { FIELD_TYPE } from '@/constants/upload'
import BillOfMaterials, {
  BillOfMaterialsProps
} from '../../components/BillOfMaterials'

export default function RightSidebar() {
  const { form } = useContext(FormWrapperContext)

  const formProjectData = useWatch([FIELD_TYPE.PROJECT], form)
  const formFilesData = useWatch([FIELD_TYPE.FILES], form)
  const [billOfMaterialsData, setBillOfMaterialsData] =
    useState<BillOfMaterialsProps>({
      machineData: [],
      blankData: [],
      knifeData: [],
      otherData: []
    })

  useEffect(() => {
    try {
      if (formProjectData) {
        const machineData =
          formProjectData?.machines_used && formProjectData?.machines_used?.id
            ? [formProjectData?.machines_used].map((item: any) => ({
                name: item?.id === 'machine-uuid' ? 'Makera' : item?.name || '',
                id: item?.id || ''
              }))
            : []

        const otherData = formProjectData?.other_parts?.[0]?.name
          ? formProjectData?.other_parts?.map((item: any) => ({
              name: item?.name || '',
              remark: item?.remark || ''
            }))
          : []

        setBillOfMaterialsData(prev => ({
          ...prev,
          machineData,
          otherData
        }))
      }
    } catch (err) {
      console.error(err)
    }
  }, [formProjectData])

  useEffect(() => {
    try {
      if (formFilesData) {
        const blankData = formFilesData
          ?.filter((f: any) => f.blank)
          .map((f: any) => f.blank)
          .map((item: any) => {
            if (Array.isArray(item) && item.length > 0) {
              const i = item[item.length - 1]
              return {
                name: i?.name || '',
                id: i?.id || ''
              }
            }
          })

        const knifeData = formFilesData
          ?.filter((f: any) => f.cutters)
          ?.map((f: any) => f.cutters)
          ?.flat()
          ?.map((item: any) => {
            if (Array.isArray(item) && item.length > 0) {
              const i = item[item.length - 1]
              return {
                name: i?.name || '',
                id: i?.id || ''
              }
            }
          })

        setBillOfMaterialsData(prev => ({
          ...prev,
          blankData,
          knifeData
        }))
      }
    } catch (error) {
      console.error(error)
    }
  }, [formFilesData])

  // tip
  const [tipVisible, setTipVisible] = useState(true)

  return (
    <div className="w-full">
      {/* Tips 区域 */}
      {tipVisible && (
        <div className="relative mb-4 flex items-start gap-3 rounded-lg bg-[#217DE8]/10 p-4">
          <MIconInfo className="" />
          <div className="flex-1">
            <strong className="text-sm">Tips</strong>
            <div className="text-xs">
              The material information you edited on the left will be
              automatically synchronized here.
            </div>
          </div>
          <CloseOutlined
            className="cursor-pointer text-sm"
            onClick={() => setTipVisible(false)}
          />
        </div>
      )}

      <div className="sticky top-[60px]">
        <Collapse
          bordered={false}
          defaultActiveKey={['1']}
          size="large"
          expandIcon={({ isActive }) => (
            <UpOutlined
              className={`transition-transform duration-300 ease-in-out ${
                isActive ? 'rotate-180' : 'rotate-0'
              }`}
            />
          )}
          expandIconPosition="end"
          className="blue-ant-collapse"
          items={[
            {
              key: '1',
              label: (
                <div className="text-base font-bold text-white">
                  Bill of materials
                </div>
              ),
              children: (
                <BillOfMaterials
                  {...billOfMaterialsData}
                  className="!mt-0 !border-none !px-0"
                />
              )
            }
          ]}
        />
      </div>
    </div>
  )
}
