'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Farcaster platform share strategy class
 * Uses Farcaster MiniApp SDK composeCast for native sharing
 */
export class FarcasterShareStrategy implements IShareStrategy {
  share = async (options: ShareOptions) => {
    const { url, text } = options

    try {
      const deeplink = `cbwallet://miniapp?url=${encodeURIComponent(url)}`

      await sdk.actions.composeCast({
        text: text || 'Check out this survey on HEARD!',
        embeds: [deeplink]
      })
    } catch (error) {
      console.error('[FarcasterShareStrategy] Failed to compose cast:', error)
      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
      } else {
        throw error
      }
    }
  }

  get canShare(): boolean {
    return true // Farcaster SDK is always available in Farcaster environment
  }
}
