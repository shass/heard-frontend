'use client'

import { useCallback } from 'react'
import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Base App platform share strategy
 * Creates Coinbase Wallet deeplink for sharing surveys
 */
export function useBaseAppShareStrategy(): IShareStrategy {
  const share = useCallback(async (options: ShareOptions) => {
    const { url, text, title } = options

    try {
      // Create Coinbase Wallet deeplink
      const deeplink = `cbwallet://miniapp?url=${encodeURIComponent(url)}`

      // Try to use native share API if available (mobile devices)
      if (typeof navigator?.share === 'function') {
        await navigator.share({
          title: title || 'HEARD Survey',
          text: text || 'Check out this survey on HEARD!',
          url: deeplink
        })
      } else if (typeof navigator?.clipboard?.writeText === 'function') {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(deeplink)
      } else {
        throw new Error('Neither share API nor clipboard API is available')
      }
    } catch (error) {
      console.error('[BaseAppShareStrategy] Failed to share:', error)

      // Final fallback: try clipboard again
      if (typeof navigator?.clipboard?.writeText === 'function') {
        const deeplink = `cbwallet://miniapp?url=${encodeURIComponent(url)}`
        await navigator.clipboard.writeText(deeplink)
      } else {
        throw error
      }
    }
  }, [])

  const canShare = typeof navigator?.share === 'function' || typeof navigator?.clipboard?.writeText === 'function'

  return {
    share,
    canShare
  }
}
