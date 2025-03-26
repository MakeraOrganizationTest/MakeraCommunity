"use client"

import { useAuth } from "@/hooks/use-auth"
import ProtectedRoute from "@/components/protected-route"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">欢迎回来，{user?.email}</h2>
          <p className="text-gray-500">
            这是一个受保护的页面，只有登录用户才能访问。
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
} 