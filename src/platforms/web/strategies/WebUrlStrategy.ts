'use client'

import { IUrlStrategy } from '../../_core/shared/interfaces/IUrlStrategy'

/**
 * Web platform URL opening strategy class
 * Uses standard window.open
 */
export class WebUrlStrategy implements IUrlStrategy {
  openUrl = async (url: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
}
