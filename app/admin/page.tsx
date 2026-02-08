'use client'

import { AdminAuthWrapper } from '@/components/admin/admin-auth-wrapper'
import { AdminDashboardWithSuspense } from '@/components/lazy'

export default function AdminPage() {
  return (
    <AdminAuthWrapper>
      <AdminDashboardWithSuspense />
    </AdminAuthWrapper>
  )
}
