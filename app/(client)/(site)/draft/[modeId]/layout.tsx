'use client'
import { useParams } from 'next/navigation'
import FormProvider, { ModeContext } from '../../upload/components/FormProvider'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { modeId = '', step = '' } = useParams()

  const modeIdStr = Array.isArray(modeId) ? modeId[0] : modeId
  const stepStr = Array.isArray(step) ? step[0] : step

  return (
    <FormProvider modeId={modeIdStr} currentStep={stepStr}>
      {children}
    </FormProvider>
  )
}
