'use client'

import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Web platform share strategy class
 * Uses clipboard API as fallback since composeCast is not available
 */
export class WebShareStrategy implements IShareStrategy {
  share = async (options: ShareOptions) => {
    const { url } = options

    // Use clipboard API on Web
    if (typeof navigator?.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(url)
    } else {
      throw new Error('Clipboard API not available')
    }
  }

  get canShare(): boolean {
    return typeof navigator?.clipboard?.writeText === 'function'
  }
}
