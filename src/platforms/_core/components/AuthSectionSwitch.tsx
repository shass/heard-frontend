'use client'

import { useRef } from 'react'
import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'
import { Platform } from '@/src/platforms/config'

export function AuthSectionSwitch() {
  const { platform } = usePlatformDetector()
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[AuthSectionSwitch] 🔄 Rendering (render #${renderCount.current}) for platform:`, platform)

  // Dynamic require() based on platform to avoid loading unnecessary code
  switch (platform) {
    case Platform.WEB: {
      const { WebAuthSection } = require('@/src/platforms/web/components/WebAuthSection')
      return <WebAuthSection />
    }
    case Platform.BASE_APP: {
      const { BaseAppAuthSection } = require('@/src/platforms/base-app/components/BaseAppAuthSection')
      return <BaseAppAuthSection />
    }
    case Platform.FARCASTER: {
      const { FarcasterAuthSection } = require('@/src/platforms/farcaster/components/FarcasterAuthSection')
      return <FarcasterAuthSection />
    }
    default: {
      // Fallback to Web
      const { WebAuthSection } = require('@/src/platforms/web/components/WebAuthSection')
      return <WebAuthSection />
    }
  }
}
