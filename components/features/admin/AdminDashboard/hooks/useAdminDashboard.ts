'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminDashboardStats } from '@/lib/api/admin'
import { useAuth } from '@/src/platforms/_core/hooks/useAuth'

export function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState('surveys')
  const auth = useAuth()
  const { isAuthenticated, user } = auth

  const {
    data: stats,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    enabled: isAuthenticated && user?.metadata?.role === 'admin', // Only fetch when authenticated as admin
    refetchInterval: 60000 // Refresh every minute
  })

  return {
    activeTab,
    setActiveTab,
    stats,
    loading,
    error,
    isAuthenticated,
    user
  }
}