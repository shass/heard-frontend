'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminDashboardStats } from '@/lib/api/admin'
import { useAuthActions } from '@/components/providers/auth-provider'

export function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState('surveys')
  const { isAuthenticated, user } = useAuthActions()

  const { 
    data: stats, 
    isLoading: loading, 
    error 
  } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    enabled: isAuthenticated && user?.role === 'admin', // Only fetch when authenticated as admin
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