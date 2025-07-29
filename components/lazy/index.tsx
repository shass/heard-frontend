'use client'

import { lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { PageLoading, RewardPageSkeleton, HeardPointsHistorySkeleton } from '@/components/ui/loading-states'

// Lazy load heavy components
export const LazyHeardPointsHistoryModal = lazy(() =>
  import('@/components/ui/heard-points-history-modal').then(module => ({
    default: module.HeardPointsHistoryModal
  }))
)

// Components with browser APIs need dynamic imports with SSR disabled

export const LazyNetworkStatus = dynamic(() =>
  import('@/components/ui/network-status').then(module => ({
    default: module.NetworkStatus
  })), {
    ssr: false,
    loading: () => null
  }
)

// Wrapper components with appropriate loading states
export function HeardPointsHistoryModal(props: any) {
  return (
    <Suspense fallback={<HeardPointsHistorySkeleton />}>
      <LazyHeardPointsHistoryModal {...props} />
    </Suspense>
  )
}

// These components already handle their own loading states via dynamic imports

export function NetworkStatus(props: any) {
  return <LazyNetworkStatus {...props} />
}

// Route-based lazy loading
export const LazyRewardPage = lazy(() =>
  import('@/components/reward-page').then(module => ({
    default: module.RewardPage
  }))
)

// Wrapped route components
export function RewardPageWithSuspense(props: any) {
  return (
    <Suspense fallback={<RewardPageSkeleton />}>
      <LazyRewardPage {...props} />
    </Suspense>
  )
}

// Admin components lazy loading
export const LazyAdminDashboard = lazy(() =>
  import('@/components/admin/admin-dashboard').then(module => ({
    default: module.AdminDashboard
  }))
)

export function AdminDashboardWithSuspense(props: any) {
  return (
    <Suspense fallback={<PageLoading message="Loading admin dashboard..." />}>
      <LazyAdminDashboard {...props} />
    </Suspense>
  )
}
