'use client'

import { useEffect, useRef } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { sdk } from '@farcaster/miniapp-sdk'
import { useBootstrap } from '@/src/core/components/AppBootstrap'

/**
 * Initializes MiniKit by calling both setMiniAppReady() and sdk.actions.ready()
 * This is required to hide the loading splash screen in Base App / Farcaster MiniKit
 *
 * NOTE: This hook should only be used in BaseAppLayout or FarcasterLayout.
 * Platform detection is already handled by PlatformLayoutSwitch.
 *
 * IMPORTANT: Must wait for bootstrap to complete before calling sdk.actions.ready()
 * In native MiniApp containers, calling ready() too early causes white screen.
 *
 * Calls both OnchainKit and Farcaster SDK for full compatibility
 * Side-effect only hook - does not return any value
 */
export function useMiniKitReady() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit()
  const { isBootstrapped } = useBootstrap()
  const hasCalledReady = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (hasCalledReady.current) return

    // Wait for bootstrap - required for native MiniApp containers
    if (!isBootstrapped) {
      console.log('[MiniKitReady] Waiting for bootstrap...')
      return
    }

    hasCalledReady.current = true

    // Call both setMiniAppReady() and sdk.actions.ready() for full compatibility
    // This hides the loading splash screen and signals the app is ready
    const initializeSDK = async () => {
      try {
        console.log('[MiniKitReady] Calling setMiniAppReady() and sdk.actions.ready()')
        await setMiniAppReady()
        await sdk.actions.ready()
        console.log('[MiniKitReady] ✅ MiniKit ready called successfully')
      } catch (error) {
        console.error('[MiniKitReady] ❌ Error calling ready():', error)
      }
    }

    initializeSDK()
  }, [setMiniAppReady, isMiniAppReady, isBootstrapped])
}
