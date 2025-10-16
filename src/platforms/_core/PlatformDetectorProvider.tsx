'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { Platform } from '../config'
import { sdk } from '@farcaster/miniapp-sdk'

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

        if (debugPlatform === 'base-app') return Platform.BASE_APP
        if (debugPlatform === 'farcaster') return Platform.FARCASTER
        if (debugPlatform === 'web') return Platform.WEB
      }

      const context = await sdk.context
      const clientFid = (context?.client as any)?.clientFid
      const clientFidStr = clientFid?.toString()

      if (clientFidStr === '309857') return Platform.BASE_APP
      if (clientFidStr === '1') return Platform.FARCASTER

      if (typeof window !== 'undefined') {
        const hasMiniKit = !!((window as any)?.webkit?.messageHandlers?.minikit || (window as any)?.MiniKit)
        if (hasMiniKit) return Platform.BASE_APP
      }

      return Platform.WEB
    }

    detectPlatform().then((detected) => {
      setPlatform(detected)
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
