'use client'

import React from 'react'
import { usePlatformDetector } from '@/src/platforms/_core/PlatformDetectorProvider'
import { Platform } from '@/src/platforms/config'

interface PlatformSwitchProps {
  web?: React.ReactNode
  baseApp?: React.ReactNode
  farcaster?: React.ReactNode
  children?: React.ReactNode
}

export function PlatformSwitch({ web, baseApp, farcaster, children }: PlatformSwitchProps) {
  try {
    const { platform } = usePlatformDetector()

    switch (platform) {
      case Platform.BASE_APP:
        return <>{baseApp || web || children}</>
      case Platform.FARCASTER:
        return <>{farcaster || web || children}</>
      case Platform.WEB:
      default:
        // Web is always the default fallback
        return <>{web || children}</>
    }
  } catch (error) {
    // Always fallback to web if platform context is not available
    return <>{web || children}</>
  }
}

export function useMigrationChoice() {
  try {
    const { platform } = usePlatformDetector()

    return {
      platform,
      shouldUseLegacy: false,
      shouldUseNew: true,
    }
  } catch (error) {
    // Fallback to web platform if context is not available
    return {
      platform: Platform.WEB,
      shouldUseLegacy: false,
      shouldUseNew: true,
    }
  }
}