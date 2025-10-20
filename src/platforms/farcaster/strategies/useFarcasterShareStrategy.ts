'use client'

import { useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Farcaster platform share strategy
 * Uses Farcaster MiniApp SDK composeCast for native sharing
 */
export function useFarcasterShareStrategy(): IShareStrategy {
  const share = useCallback(async (options: ShareOptions) => {
    const { url, text } = options

    try {
      // Use Farcaster SDK composeCast for native sharing
      await sdk.actions.composeCast({
        text: text || 'Check out this survey on HEARD!',
        embeds: [url]
      })
    } catch (error) {
      console.error('[FarcasterShareStrategy] Failed to compose cast:', error)
      // Fallback to clipboard if SDK fails
      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
      } else {
        throw error
      }
    }
  }, [])

  const canShare = true // Farcaster SDK is always available in Farcaster environment

  return {
    share,
    canShare
  }
}
