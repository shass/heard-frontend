'use client'

import { useEffect, useRef } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'

/**
 * Initializes MiniKit by calling setMiniAppReady()
 * This is required to hide the loading splash screen in Base App / Farcaster MiniKit
 *
 * NOTE: This hook should only be used in BaseAppLayout or FarcasterLayout.
 * Platform detection is already handled by PlatformLayoutSwitch.
 *
 * Uses OnchainKit MiniKit instead of direct SDK access
 * Side-effect only hook - does not return any value
 */
export function useMiniKitReady() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit()
  const hasCalledReady = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (hasCalledReady.current || isMiniAppReady) return

    hasCalledReady.current = true

    // Call setMiniAppReady() as per OnchainKit documentation
    // This hides the loading splash screen and signals the app is ready
    const initializeSDK = async () => {
      try {
        console.log('[MiniKitReady] Calling setMiniAppReady()')
        await setMiniAppReady()
        console.log('[MiniKitReady] ✅ MiniKit ready called successfully')
      } catch (error) {
        console.error('[MiniKitReady] ❌ Error calling setMiniAppReady():', error)
      }
    }

    initializeSDK()
  }, [setMiniAppReady, isMiniAppReady])
}
