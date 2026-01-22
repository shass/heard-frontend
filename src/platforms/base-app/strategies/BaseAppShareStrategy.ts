'use client'

import type { IShareStrategy, ShareOptions } from '../../_core/shared/interfaces/IShareStrategy'

/**
 * Base App platform share strategy class
 * Shares HTTPS URLs that work in messengers and auto-redirect to Base App
 */
export class BaseAppShareStrategy implements IShareStrategy {
  share = async (options: ShareOptions) => {
    const { url, text, title } = options

    try {
      if (typeof navigator?.share === 'function') {
        await navigator.share({
          title: title || 'HEARD Survey',
          text: text || 'Check out this survey on HEARD!',
          url
        })
      } else if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
      } else {
        throw new Error('Neither share API nor clipboard API is available')
      }
    } catch (error) {
      console.error('[BaseAppShareStrategy] Failed to share:', error)

      if (typeof navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
      } else {
        throw error
      }
    }
  }

  get canShare(): boolean {
    return typeof navigator?.share === 'function' || typeof navigator?.clipboard?.writeText === 'function'
  }
}
