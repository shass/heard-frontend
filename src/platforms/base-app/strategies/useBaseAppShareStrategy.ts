'use client'

import { useCallback } from 'react'
import { useComposeCast } from '@coinbase/onchainkit/minikit'
import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Base App platform share strategy
 * Uses composeCast from MiniKit for native sharing experience
 */
export function useBaseAppShareStrategy(): IShareStrategy {
  const { composeCast } = useComposeCast()

  const share = useCallback(async (options: ShareOptions) => {
    const { url, text } = options

    try {
      // Use composeCast for native Base App sharing
      // Use deeplink format to ensure it opens in Base App
      const deeplink = `cbwallet://miniapp?url=${encodeURIComponent(url)}`

      composeCast({
        text: text || 'Check out this survey on HEARD!',
        embeds: [deeplink]
      })
    } catch (error) {
      console.error('[BaseAppShareStrategy] Failed to compose cast:', error)
      // Fallback to clipboard if composeCast fails
      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
      } else {
        throw error
      }
    }
  }, [composeCast])

  const canShare = !!composeCast || typeof navigator?.clipboard?.writeText === 'function'

  return {
    share,
    canShare
  }
}
