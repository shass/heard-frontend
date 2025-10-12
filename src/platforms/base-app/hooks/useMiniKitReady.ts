'use client'

import { useEffect, useRef, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function useMiniKitReady() {
  const [isReady, setIsReady] = useState(false)
  const hasCalledReady = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (hasCalledReady.current) return

    // Check if we're in a Mini App context
    const isMiniApp = typeof window !== 'undefined' && (
      window.location.hostname.includes('base.org') ||
      window.location.hostname.includes('farcaster.xyz') ||
      'miniKit' in window
    )

    if (!isMiniApp) {
      console.log('[MiniKitReady] Not in Mini App context, skipping sdk.actions.ready()')
      return
    }

    // Mark as called to prevent double calls
    hasCalledReady.current = true

    // Call sdk.actions.ready() as per Base documentation
    // This hides the loading splash screen and signals the app is ready
    const initializeSDK = async () => {
      try {
        console.log('[MiniKitReady] Calling sdk.actions.ready()')
        await sdk.actions.ready()
        console.log('[MiniKitReady] ✅ SDK ready called successfully')
        setIsReady(true)
      } catch (error) {
        console.error('[MiniKitReady] ❌ Error calling sdk.actions.ready():', error)
        // Even if there's an error, mark as ready to not block the UI
        setIsReady(true)
      }
    }

    initializeSDK()
  }, [])

  return { isReady }
}
