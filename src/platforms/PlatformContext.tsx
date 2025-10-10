'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { Platform } from './config'
import { IPlatformProvider } from './shared/interfaces/IPlatformProvider'
import { PlatformManager } from './PlatformManager'

interface PlatformContextValue {
  platform: Platform | null
  provider: IPlatformProvider | null
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  platformInfo: {
    platform: Platform
    name: string
    version: string
    features: string[]
    supported: boolean
  } | null
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

interface PlatformProviderProps {
  children: React.ReactNode
}

export function PlatformProvider({ children }: PlatformProviderProps) {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [provider, setProvider] = useState<IPlatformProvider | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [platformInfo, setPlatformInfo] = useState<PlatformContextValue['platformInfo']>(null)

  // Use MiniKit hook from OnChainKit - it handles initialization properly
  const miniKit = useMiniKit()

  useEffect(() => {
    console.log('[PlatformContext] 🚀 useEffect started')
    console.log('[PlatformContext] MiniKit context:', miniKit.context ? 'available' : 'not available')

    // Alert for debugging (will show before Eruda loads)
    if (typeof window !== 'undefined') {
      const hasContext = !!miniKit.context
      const clientFid = (miniKit.context as any)?.client?.fid || (miniKit.context as any)?.client?.clientFid
      window.localStorage.setItem('debug_platform_init', JSON.stringify({
        hasContext,
        clientFid,
        timestamp: new Date().toISOString()
      }))
    }

    const initializePlatform = async () => {
      try {
        console.log('[PlatformContext] 🔧 Starting platform initialization')
        setIsLoading(true)
        setError(null)

        // Get MiniKit context from OnChainKit hook
        let miniKitContext
        if (miniKit.context) {
          const ctx = miniKit.context as any
          miniKitContext = {
            context: {
              client: {
                clientFid: ctx.client?.fid || ctx.client?.clientFid,
                name: ctx.client?.displayName || ctx.client?.name
              },
              user: ctx.user ? {
                fid: ctx.user.fid,
                username: ctx.user.username
              } : undefined
            }
          }
          console.log('[PlatformContext] ✅ Got MiniKit context from hook:', {
            clientFid: ctx.client?.fid || ctx.client?.clientFid,
            clientName: ctx.client?.displayName || ctx.client?.name,
            userFid: ctx.user?.fid
          })
        } else {
          console.log('[PlatformContext] ⚠️ No MiniKit context available')
        }

        console.log('[PlatformContext] 🔧 Initializing PlatformManager')

        const manager = PlatformManager.getInstance()
        await manager.initialize(miniKitContext)

        const currentPlatform = manager.getCurrentPlatform()
        const currentProvider = manager.getCurrentProvider()
        const info = manager.getPlatformInfo()

        // Save detected platform to localStorage for debugging
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('debug_detected_platform', currentPlatform || 'null')
        }

        setPlatform(currentPlatform)
        setProvider(currentProvider)
        setPlatformInfo(info)
        setIsInitialized(true)

      } catch (err) {
        console.error('Failed to initialize platform:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    initializePlatform()

    return () => {
      // Cleanup on unmount
      PlatformManager.getInstance().shutdown()
    }
  }, [miniKit.context]) // Re-initialize when MiniKit context becomes available
  
  const value: PlatformContextValue = {
    platform,
    provider,
    isInitialized,
    isLoading,
    error,
    platformInfo
  }
  
  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext)
  
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider')
  }
  
  return context
}