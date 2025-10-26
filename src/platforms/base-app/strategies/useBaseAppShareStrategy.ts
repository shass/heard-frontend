'use client'

import { useCallback } from 'react'
import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Base App platform share strategy
 * Shares HTTPS URLs that work in messengers and auto-redirect to Base App
 */
export function useBaseAppShareStrategy(): IShareStrategy {
  const share = useCallback(async (options: ShareOptions) => {
    const { url, text, title } = options

    try {
      // Use regular HTTPS URL - it's clickable in messengers
      // The /share/[id] page will handle auto-redirect to Base App
      // Try to use native share API if available (mobile devices)
      if (typeof navigator?.share === 'function') {
        await navigator.share({
          title: title || 'HEARD Survey',
          text: text || 'Check out this survey on HEARD!',
          url
        })
      } else if (typeof navigator?.clipboard?.writeText === 'function') {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(url)
      } else {
        throw new Error('Neither share API nor clipboard API is available')
      }
    } catch (error) {
      console.error('[BaseAppShareStrategy] Failed to share:', error)

      // Final fallback: try clipboard again
      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
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
