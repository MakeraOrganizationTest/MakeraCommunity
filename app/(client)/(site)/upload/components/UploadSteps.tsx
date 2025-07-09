import { Steps } from 'antd'

const steps = [
  {
    title: <strong>Add Files</strong>
  },
  {
    title: <strong>Creation Information</strong>
  },
  {
    title: <strong>Success</strong>
  }
]

export type StepsStatusTypes = 'wait' | 'process' | 'finish' | 'error'
export type StepsTypes = 0 | 1 | 2

export default function UploadSteps({
  currentStep,
  currentStepStatus
}: {
  currentStep: StepsTypes
  currentStepStatus: StepsStatusTypes
}) {
  return (
    <Steps
      size="small"
      current={currentStep}
      items={steps}
      status={currentStepStatus}
      className="grey-ant-steps"
    />
  )
}
