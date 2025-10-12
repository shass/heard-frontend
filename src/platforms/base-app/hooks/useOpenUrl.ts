'use client'

import { sdk } from '@farcaster/miniapp-sdk'

/**
 * Hook to open URLs in Base App
 * Wrapper around sdk.actions.openUrl
 */
export function useOpenUrl() {
  const openUrl = async (url: string) => {
    try {
      await sdk.actions.openUrl(url)
    } catch (error) {
      console.error('[useOpenUrl] Error opening URL:', error)
      // Fallback to window.open for web
      if (typeof window !== 'undefined') {
        window.open(url, '_blank')
      }
    }
  }

  return openUrl
}
