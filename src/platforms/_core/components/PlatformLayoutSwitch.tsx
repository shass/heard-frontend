'use client'

import { ReactNode, lazy, Suspense, useRef } from 'react'
import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'
import { Platform } from '@/src/platforms/config'
import BaseAppLayout from '@/src/platforms/base-app/layouts/BaseAppLayout'

// Dynamic imports for code splitting
// const BaseAppLayout = lazy(() => import('@/src/platforms/base-app/layouts/BaseAppLayout'))
const FarcasterLayout = lazy(() => import('@/src/platforms/farcaster/layouts/FarcasterLayout'))
const WebLayout = lazy(() => import('@/src/platforms/web/layouts/WebLayout'))

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
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[PlatformLayoutSwitch] 🎨 Rendering (render #${renderCount.current}) - Platform:`, platform, 'isLoading:', isLoading)

  // Show loading state during platform detection
  if (isLoading) {
    console.log('[PlatformLayoutSwitch] ⏳ Showing loading fallback')
    return <LayoutLoadingFallback />
  }

  console.log('[PlatformLayoutSwitch] ✅ Rendering platform layout for:', platform)

  // Render appropriate layout based on platform
  // Base App: direct import (no lazy loading to avoid remounting issues)
  if (platform === Platform.BASE_APP) {
    return <BaseAppLayout>{children}</BaseAppLayout>
  }

  // Other platforms: lazy loaded with Suspense
  return (
    <Suspense fallback={<LayoutLoadingFallback />}>
      {platform === Platform.FARCASTER && (
        <FarcasterLayout>{children}</FarcasterLayout>
      )}
      {platform === Platform.WEB && (
        <WebLayout>{children}</WebLayout>
      )}
    </Suspense>
  )
}
