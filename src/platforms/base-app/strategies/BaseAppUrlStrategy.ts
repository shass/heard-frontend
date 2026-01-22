'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { IUrlStrategy } from '../../_core/shared/interfaces/IUrlStrategy'

/**
 * Base App platform URL opening strategy class
 * Uses Farcaster MiniApp SDK
 */
export class BaseAppUrlStrategy implements IUrlStrategy {
  openUrl = async (url: string): Promise<void> => {
    try {
      await sdk.actions.openUrl(url)
    } catch (error) {
      console.error('[BaseAppUrlStrategy] Error opening URL:', error)
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }
}
