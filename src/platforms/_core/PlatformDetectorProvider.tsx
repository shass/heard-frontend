'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
    // Set loading state at the start of detection
    setIsLoading(true)

    const detectPlatform = async () => {
      const timestamp = new Date().toISOString()
      console.log('[PlatformDetector] 🔍 Starting detection...')

      // Get MiniKit context
      const context = await sdk.context

      // Check for MiniKit context
      const clientFid = context?.client?.fid || context?.client?.clientFid

      // Save to localStorage for debugging (survives Eruda init)
      if (typeof window !== 'undefined') {
        const logs = JSON.parse(localStorage.getItem('debug_platform_logs') || '[]')
        logs.push({
          timestamp,
          clientFid,
          clientFidType: typeof clientFid,
          hasContext: !!context,
          contextKeys: context ? Object.keys(context) : [],
          hasMiniKitAPI: !!(
            (window as any)?.webkit?.messageHandlers?.minikit ||
            (window as any)?.MiniKit
          )
        })
        // Keep last 10 logs
        if (logs.length > 10) logs.shift()
        localStorage.setItem('debug_platform_logs', JSON.stringify(logs, null, 2))
      }

      console.log('[PlatformDetector] clientFid:', clientFid, 'type:', typeof clientFid)
      console.log('[PlatformDetector] Full context:', context)

      // Convert clientFid to string for comparison
      const clientFidStr = clientFid?.toString()

      // Check for Base App by clientFid
      if (clientFidStr === '309857') {
        console.log('[PlatformDetector] ✅ Detected Base App (by clientFid)')
        return Platform.BASE_APP
      }

      // Check for Farcaster by clientFid
      if (clientFidStr === '1') {
        console.log('[PlatformDetector] ✅ Detected Farcaster (by clientFid)')
        return Platform.FARCASTER
      }

      // Check for MiniKit APIs presence
      if (typeof window !== 'undefined') {
        const hasMiniKit = !!(
          (window as any)?.webkit?.messageHandlers?.minikit ||
          (window as any)?.MiniKit
        )

        if (hasMiniKit) {
          console.log('[PlatformDetector] ⚠️ MiniKit APIs detected but no platform identified')
          console.log('[PlatformDetector] Assuming Base App (MiniKit present)')
          return Platform.BASE_APP
        }
      }

      // Fallback to web
      console.log('[PlatformDetector] ℹ️ Defaulting to Web platform')
      return Platform.WEB
    }

    detectPlatform().then((detected) => {
      console.log('[PlatformDetector] 🔄 Setting platform to:', detected)
      setPlatform(detected)
      setIsInitialized(true)
      setIsLoading(false)

      // Debug logging
      if (typeof window !== 'undefined') {
        localStorage.setItem('debug_detected_platform', detected)
        console.log('[PlatformDetector] 🎯 Final platform:', detected)
        console.log('[PlatformDetector] ✅ isLoading set to false, platform state updated')
        console.log('[PlatformDetector] 💡 To see full detection history, run: JSON.parse(localStorage.getItem("debug_platform_logs"))')
      }
    })
  }, [])

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
