'use client'

import { useCallback } from 'react'
import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Web platform share strategy
 * Uses clipboard API as fallback since composeCast is not available
 */
export function useWebShareStrategy(): IShareStrategy {
  const share = useCallback(async (options: ShareOptions) => {
    const { url } = options

    // Use clipboard API on Web
    if (typeof navigator?.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(url)
    } else {
      throw new Error('Clipboard API not available')
    }
  }, [])

  const canShare = typeof navigator?.clipboard?.writeText === 'function'

  return {
    share,
    canShare
  }
}
