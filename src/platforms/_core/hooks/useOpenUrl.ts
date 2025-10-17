'use client'

import { usePlatformDetector } from '@/src/platforms'
import { Platform } from '../../config'
import type { IUrlStrategy } from '../shared/interfaces/IUrlStrategy'

export function useOpenUrl() {
  const { platform } = usePlatformDetector()

  const getStrategy = (): IUrlStrategy => {
    switch (platform) {
      case Platform.WEB: {
        const { useWebUrlStrategy } = require('@/src/platforms/web/strategies/useWebUrlStrategy')
        return useWebUrlStrategy()
      }
      case Platform.BASE_APP: {
        const { useBaseAppUrlStrategy } = require('@/src/platforms/base-app/strategies/useBaseAppUrlStrategy')
        return useBaseAppUrlStrategy()
      }
      case Platform.FARCASTER: {
        const { useFarcasterUrlStrategy } = require('@/src/platforms/farcaster/strategies/useFarcasterUrlStrategy')
        return useFarcasterUrlStrategy()
      }
      default: {
        const { useWebUrlStrategy } = require('@/src/platforms/web/strategies/useWebUrlStrategy')
        return useWebUrlStrategy()
      }
    }
  }

  return getStrategy().openUrl
}
