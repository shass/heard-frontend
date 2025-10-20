import { sdk } from '@farcaster/miniapp-sdk'

/**
 * Farcaster platform URL opening strategy
 * Uses Farcaster MiniApp SDK
 */
export function useFarcasterUrlStrategy() {
  const openUrl = async (url: string): Promise<void> => {
    try {
      await sdk.actions.openUrl(url)
    } catch (error) {
      console.error('[useFarcasterUrlStrategy] Error opening URL:', error)
      // Fallback to window.open if SDK fails
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return { openUrl }
}
