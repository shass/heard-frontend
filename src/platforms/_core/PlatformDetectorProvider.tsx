'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Platform } from '../config'
import { useMiniKit } from '@coinbase/onchainkit/minikit'

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

  const miniKit = useMiniKit()

  useEffect(() => {
    const detectPlatform = () => {
      // Check for MiniKit context
      const clientFid = (miniKit.context as any)?.client?.fid ||
                        (miniKit.context as any)?.client?.clientFid

      if (clientFid) {
        if (clientFid === '309857') {
          return Platform.BASE_APP
        } else if (clientFid === '1') {
          return Platform.FARCASTER
        }
      }

      // Fallback to web
      return Platform.WEB
    }

    const detected = detectPlatform()
    setPlatform(detected)
    setIsInitialized(true)
    setIsLoading(false)

    // Debug logging
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug_detected_platform', detected)
      console.log('[PlatformDetector] Detected platform:', detected)
      console.log('[PlatformDetector] MiniKit context:', miniKit.context)
    }
  }, [miniKit.context])

  return (
    <Context.Provider value={{ platform, isInitialized, isLoading }}>
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
