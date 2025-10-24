'use client'

import { useEffect, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * Initializes MiniKit SDK by calling sdk.actions.ready()
 * This is required to hide the loading splash screen in Base App / Farcaster MiniKit
 *
 * NOTE: This hook should only be used in BaseAppLayout or FarcasterLayout.
 * Platform detection is already handled by PlatformLayoutSwitch.
 *
 * Side-effect only hook - does not return any value
 */
export function useMiniKitReady() {
  const hasCalledReady = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (hasCalledReady.current) return

    hasCalledReady.current = true

    // Call sdk.actions.ready() as per Base documentation
    // This hides the loading splash screen and signals the app is ready
    const initializeSDK = async () => {
      try {
        console.log('[MiniKitReady] Calling sdk.actions.ready()')
        await sdk.actions.ready()
        console.log('[MiniKitReady] ✅ SDK ready called successfully')
      } catch (error) {
        console.error('[MiniKitReady] ❌ Error calling sdk.actions.ready():', error)
      }
    }

    initializeSDK()
  }, [])
}
