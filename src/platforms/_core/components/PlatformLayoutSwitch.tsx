'use client'

import { ReactNode, lazy, Suspense } from 'react'
import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'
import { Platform } from '@/src/platforms/config'
import BaseAppLayout from '@/src/platforms/base-app/layouts/BaseAppLayout'
import WebLayout from '@/src/platforms/web/layouts/WebLayout'

// Dynamic imports for code splitting
const FarcasterLayout = lazy(() => import('@/src/platforms/farcaster/layouts/FarcasterLayout'))

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

  if (isLoading) return <LayoutLoadingFallback />

  if (platform === Platform.BASE_APP) {
    return <BaseAppLayout>{children}</BaseAppLayout>
  }

  if (platform === Platform.WEB) {
    return <WebLayout>{children}</WebLayout>
  }

  // Farcaster: lazy loaded with Suspense
  return (
    <Suspense fallback={<LayoutLoadingFallback />}>
      {platform === Platform.FARCASTER && (
        <FarcasterLayout>{children}</FarcasterLayout>
      )}
    </Suspense>
  )
}
