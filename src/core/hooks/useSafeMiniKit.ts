'use client'

import { useMiniKit as useOnchainKitMiniKit } from '@coinbase/onchainkit/minikit'
import { usePlatform } from './usePlatform'

type MiniKitReturn = {
  context: any | null
  isMiniAppReady: boolean
  setMiniAppReady: ((readyOptions?: any) => Promise<any>) | null
  updateClientContext: ((context: any) => void) | null
  notificationProxyUrl: string | null
}

/**
 * Platform-aware wrapper for useMiniKit
 * Returns null values for Web platform to prevent MiniKit errors
 * Uses real MiniKit for BaseApp/Farcaster platforms
 */
export function useSafeMiniKit(): MiniKitReturn {
  const { platform, isLoading } = usePlatform()

  // For Web platform, return null values - MiniKit not needed
  if (!isLoading && platform?.id === 'web') {
    return {
      context: null,
      isMiniAppReady: false,
      setMiniAppReady: null,
      updateClientContext: null,
      notificationProxyUrl: null,
    }
  }

  // For BaseApp/Farcaster platforms, use real MiniKit
  try {
    const miniKit = useOnchainKitMiniKit()
    return {
      context: miniKit.context,
      isMiniAppReady: miniKit.isMiniAppReady,
      setMiniAppReady: miniKit.setMiniAppReady,
      updateClientContext: miniKit.updateClientContext,
      notificationProxyUrl: miniKit.notificationProxyUrl,
    }
  } catch (error) {
    // Fallback if MiniKit fails
    console.warn('[useSafeMiniKit] MiniKit not available:', error)
    return {
      context: null,
      isMiniAppReady: false,
      setMiniAppReady: null,
      updateClientContext: null,
      notificationProxyUrl: null,
    }
  }
}
