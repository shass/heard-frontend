'use client'

import React from 'react'
import { usePlatform } from '@/src/platforms/PlatformContext'

interface PlatformSwitchProps {
  web?: React.ReactNode
  baseApp?: React.ReactNode
  farcaster?: React.ReactNode
  children?: React.ReactNode
}

export function PlatformSwitch({ web, baseApp, farcaster, children }: PlatformSwitchProps) {
  try {
    const { platform } = usePlatform()

    switch (platform) {
      case 'base-app':
        return <>{baseApp || web || children}</>
      case 'farcaster':
        return <>{farcaster || web || children}</>
      case 'web':
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
    const { platform } = usePlatform()
    
    return {
      platform,
      shouldUseLegacy: false,
      shouldUseNew: true,
    }
  } catch (error) {
    // Fallback to web platform if context is not available
    return {
      platform: 'web' as const,
      shouldUseLegacy: false,
      shouldUseNew: true,
    }
  }
}