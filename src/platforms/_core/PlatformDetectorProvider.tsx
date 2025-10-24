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
      // Get MiniKit context from SDK
      // According to MiniKit documentation, platform is determined ONLY by clientFid:
      // - Base App: clientFid === '309857'
      // - Farcaster: clientFid === '1'
      try {
        const context = await sdk.context
        const clientFid = (context?.client as any)?.clientFid
        const clientFidStr = clientFid?.toString()

        console.log('[PlatformDetector] MiniKit context:', {
          hasContext: !!context,
          clientFid: clientFidStr,
          userFid: context?.user?.fid
        })

        // Exact match for Base App (per MiniKit docs)
        if (clientFidStr === FARCASTER_CLIENT_FID.BASE_APP) {
          return Platform.BASE_APP
        }

        // Exact match for Farcaster (per MiniKit docs)
        if (clientFidStr === FARCASTER_CLIENT_FID.FARCASTER) {
          return Platform.FARCASTER
        }
      } catch (error) {
        console.log('[PlatformDetector] SDK context not available:', error)
      }

      // Default to Web platform
      // NOTE: Do NOT use presence of MiniKit APIs to determine platform
      // Only clientFid can reliably identify Base App vs Farcaster
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
