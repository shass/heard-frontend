'use client'

import { useMemo } from 'react'
import { usePlatform } from '@/src/core/hooks/usePlatform'

export function useOpenUrl() {
  const { platform, isLoading, error } = usePlatform()

  const openUrl = useMemo(() => {
    if (isLoading) {
      throw new Error('[useOpenUrl] Platform is still loading')
    }

    if (error) {
      throw error
    }

    if (!platform) {
      throw new Error('[useOpenUrl] No active platform detected')
    }

    const strategy = platform.createUrlStrategy()
    return strategy.openUrl
  }, [platform, isLoading, error])

  return openUrl
}
