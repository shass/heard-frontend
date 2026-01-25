'use client'

import { useMemo } from 'react'
import { usePlatform } from '@/src/core/hooks/usePlatform'
import type { IShareStrategy } from '../shared/interfaces/IShareStrategy'

/**
 * Platform-agnostic share hook using Strategy Pattern
 * Gets share strategy from active platform plugin
 */
export function useShare(): IShareStrategy {
  const { platform, isLoading, error } = usePlatform()

  const shareStrategy = useMemo(() => {
    if (isLoading) {
      throw new Error('[useShare] Platform is still loading')
    }

    if (error) {
      throw error
    }

    if (!platform) {
      throw new Error('[useShare] No active platform detected')
    }

    return platform.createShareStrategy()
  }, [platform, isLoading, error])

  return shareStrategy
}
