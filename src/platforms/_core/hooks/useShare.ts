'use client'

import { usePlatformDetector } from '../PlatformDetectorProvider'
import { Platform } from '../../config'
import type { IShareStrategy } from '../shared/interfaces/IShareStrategy'

/**
 * Platform-agnostic share hook using Strategy Pattern
 * - Base App: Coinbase Wallet deeplink via native share API or clipboard
 * - Farcaster: composeCast from @farcaster/miniapp-sdk for native sharing
 * - Web: clipboard copy
 */
export function useShare() {
  const { platform } = usePlatformDetector()

  const getStrategy = (): IShareStrategy => {
    switch (platform) {
      case Platform.BASE_APP: {
        const { useBaseAppShareStrategy } = require('@/src/platforms/base-app/strategies/useBaseAppShareStrategy')
        return useBaseAppShareStrategy()
      }
      case Platform.FARCASTER: {
        const { useFarcasterShareStrategy } = require('@/src/platforms/farcaster/strategies/useFarcasterShareStrategy')
        return useFarcasterShareStrategy()
      }
      case Platform.WEB:
      default: {
        const { useWebShareStrategy } = require('@/src/platforms/web/strategies/useWebShareStrategy')
        return useWebShareStrategy()
      }
    }
  }

  return getStrategy()
}
