'use client'

import { lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { PageLoading, SurveyTableSkeleton, RewardPageSkeleton, HeardPointsHistorySkeleton } from '@/components/ui/loading-states'

// Lazy load heavy components
export const LazyHeardPointsHistoryModal = lazy(() => 
  import('@/components/ui/heard-points-history-modal').then(module => ({
    default: module.HeardPointsHistoryModal
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
export function HeardPointsHistoryModal(props: any) {
  return (
    <Suspense fallback={<HeardPointsHistorySkeleton />}>
      <LazyHeardPointsHistoryModal {...props} />
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

// Временно убираем lazy loading для диагностики
import { SurveyPage } from '@/components/survey-page'

function DiagnosticSurveyPage(props: any) {
  console.log('DiagnosticSurveyPage rendering with props:', props)
  try {
    return <SurveyPage {...props} />
  } catch (error) {
    console.error('DiagnosticSurveyPage error:', error)
    return <div>Error in SurveyPage: {error.message}</div>
  }
}

export const LazySurveyPage = DiagnosticSurveyPage

// Wrapped route components
export function RewardPageWithSuspense(props: any) {
  return (
    <Suspense fallback={<RewardPageSkeleton />}>
      <LazyRewardPage {...props} />
    </Suspense>
  )
}

export function SurveyPageWithSuspense(props: any) {
  console.log('SurveyPageWithSuspense rendering with props:', props)
  try {
    return (
      <Suspense fallback={<PageLoading message="Loading survey..." />}>
        <LazySurveyPage {...props} />
      </Suspense>
    )
  } catch (error) {
    console.error('SurveyPageWithSuspense error:', error)
    return <PageLoading message="Error loading survey..." />
  }
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
