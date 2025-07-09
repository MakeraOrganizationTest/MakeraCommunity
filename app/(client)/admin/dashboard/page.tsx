import { SectionCards } from './section-cards'
import { ChartAreaInteractive } from './chart-area-interactive'
import ProtectedRoute from '@/components/protected-route'
import { P } from '@/constants/permissions'

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredPermission={P.PAGE.DASHBOARD}>
      <div className="w-full">
        <SectionCards />
        <div className="mt-5">
          <ChartAreaInteractive />
        </div>
      </div>
    </ProtectedRoute>
  )
}
