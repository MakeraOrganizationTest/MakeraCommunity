'use client'
import { useParams } from 'next/navigation'
import FormProvider from './components/FormProvider'
import Upload from '../draft/[modeId]/page'

export default function UploadPage() {
  const { modeId = '', step = '' } = useParams()

  const modeIdStr = Array.isArray(modeId) ? modeId[0] : modeId
  const stepStr = Array.isArray(step) ? step[0] : step

  return (
    <FormProvider modeId={modeIdStr} currentStep={stepStr}>
      <Upload />
    </FormProvider>
  )
}
