'use client'

import { ReactNode, lazy, Suspense } from 'react'
import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'
import { Platform } from '@/src/platforms/config'

// Dynamic imports для code splitting
const BaseAppLayout = lazy(() => import('./BaseAppLayout'))
const FarcasterLayout = lazy(() => import('./FarcasterLayout'))
const WebLayout = lazy(() => import('./WebLayout'))

interface PlatformLayoutSwitchProps {
  children: ReactNode
}

// Loading fallback
function LayoutLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#666'
    }}>
      Loading...
    </div>
  )
}

export function PlatformLayoutSwitch({ children }: PlatformLayoutSwitchProps) {
  const { platform, isLoading } = usePlatformDetector()

  console.log('[PlatformLayoutSwitch] Platform:', platform, 'Loading:', isLoading)

  // Show loading state during platform detection
  if (isLoading) {
    return <LayoutLoadingFallback />
  }

  // Render appropriate layout based on platform
  return (
    <Suspense fallback={<LayoutLoadingFallback />}>
      {platform === Platform.BASE_APP && (
        <BaseAppLayout>{children}</BaseAppLayout>
      )}
      {platform === Platform.FARCASTER && (
        <FarcasterLayout>{children}</FarcasterLayout>
      )}
      {platform === Platform.WEB && (
        <WebLayout>{children}</WebLayout>
      )}
    </Suspense>
  )
}
