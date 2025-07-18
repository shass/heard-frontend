'use client'

import { lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { PageLoading, SurveyTableSkeleton, RewardPageSkeleton, HerdPointsHistorySkeleton } from '@/components/ui/loading-states'

// Lazy load heavy components
export const LazyHerdPointsHistoryModal = lazy(() => 
  import('@/components/ui/herd-points-history-modal').then(module => ({
    default: module.HerdPointsHistoryModal
  }))
)

// Components with browser APIs need dynamic imports with SSR disabled
export const LazyAccessibilityPanel = dynamic(() => 
  import('@/components/ui/accessibility').then(module => ({
    default: module.AccessibilityPanel
  })), {
    ssr: false,
    loading: () => null
  }
)

export const LazyNetworkStatus = dynamic(() => 
  import('@/components/ui/network-status').then(module => ({
    default: module.NetworkStatus
  })), {
    ssr: false,
    loading: () => null
  }
)

// Wrapper components with appropriate loading states
export function HerdPointsHistoryModal(props: any) {
  return (
    <Suspense fallback={<HerdPointsHistorySkeleton />}>
      <LazyHerdPointsHistoryModal {...props} />
    </Suspense>
  )
}

// These components already handle their own loading states via dynamic imports
export function AccessibilityPanel(props: any) {
  return <LazyAccessibilityPanel {...props} />
}

export function NetworkStatus(props: any) {
  return <LazyNetworkStatus {...props} />
}

// Route-based lazy loading
export const LazyRewardPage = lazy(() => 
  import('@/components/reward-page').then(module => ({
    default: module.RewardPage
  }))
)

export const LazySurveyPage = lazy(() => 
  import('@/components/survey-page').then(module => ({
    default: module.SurveyPage
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

export function SurveyPageWithSuspense(props: any) {
  return (
    <Suspense fallback={<PageLoading message="Loading survey..." />}>
      <LazySurveyPage {...props} />
    </Suspense>
  )
}

// Admin components lazy loading
export const LazyAdminDashboard = lazy(() => 
  import('@/components/admin/admin-dashboard').then(module => ({
    default: module.AdminDashboard
  }))
)

export const LazySurveyManagement = lazy(() => 
  import('@/components/admin/survey-management').then(module => ({
    default: module.SurveyManagement
  }))
)

export const LazyWhitelistManagement = lazy(() => 
  import('@/components/admin/whitelist-management').then(module => ({
    default: module.WhitelistManagement
  }))
)

export function AdminDashboardWithSuspense(props: any) {
  return (
    <Suspense fallback={<PageLoading message="Loading admin dashboard..." />}>
      <LazyAdminDashboard {...props} />
    </Suspense>
  )
}