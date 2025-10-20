'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { Platform, FARCASTER_CLIENT_FID } from '../config'
import { sdk } from '@farcaster/miniapp-sdk'
import { platformState } from '@/lib/platform/platformState'
import { apiClient } from '@/lib/api/client'
import { LocalStorageTokenStorage, NoOpTokenStorage } from '@/lib/api/token-storage'

interface PlatformDetectorContext {
  platform: Platform
  isInitialized: boolean
  isLoading: boolean
}

const Context = createContext<PlatformDetectorContext | null>(null)

export function PlatformDetectorProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<Platform>(Platform.WEB)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)

    const detectPlatform = async () => {
      // Check for debug override in localStorage or URL
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const debugPlatform = urlParams.get('debug_platform') || localStorage.getItem('debug_platform')

        if (debugPlatform === Platform.BASE_APP) return Platform.BASE_APP
        if (debugPlatform === Platform.FARCASTER) return Platform.FARCASTER
        if (debugPlatform === Platform.WEB) return Platform.WEB
      }

      const context = await sdk.context
      const clientFid = (context?.client as any)?.clientFid
      const clientFidStr = clientFid?.toString()

      if (clientFidStr === FARCASTER_CLIENT_FID.BASE_APP) return Platform.BASE_APP
      if (clientFidStr === FARCASTER_CLIENT_FID.FARCASTER) return Platform.FARCASTER

      if (typeof window !== 'undefined') {
        const hasMiniKit = !!((window as any)?.webkit?.messageHandlers?.minikit || (window as any)?.MiniKit)
        if (hasMiniKit) return Platform.BASE_APP
      }

      return Platform.WEB
    }

    detectPlatform().then((detected) => {
      console.log('[PlatformDetector] Detected platform:', detected)

      setPlatform(detected)
      platformState.setPlatform(detected)

      // Configure ApiClient with platform-specific token storage
      const tokenStorage = detected === Platform.BASE_APP
        ? new LocalStorageTokenStorage()
        : new NoOpTokenStorage()

      apiClient.setTokenStorage(tokenStorage)
      console.log('[PlatformDetector] ApiClient configured for platform:', detected)

      setIsInitialized(true)
      setIsLoading(false)
    })
  }, [])

  const contextValue = useMemo(() =>
    ({ platform, isInitialized, isLoading }),
    [platform, isInitialized, isLoading]
  )

  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  )
}

export function usePlatformDetector() {
  const context = useContext(Context)
  if (!context) {
    throw new Error('usePlatformDetector must be used within PlatformDetectorProvider')
  }
  return context
}
