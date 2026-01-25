'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { platformRegistry } from '@/src/core/registry/PlatformRegistry'
import { IPlatformPlugin } from '@/src/core/interfaces/IPlatformPlugin'
import { PlatformConfig, PlatformFeatures } from '@/src/core/interfaces/types'

interface PlatformContextType {
  platform: IPlatformPlugin | null
  isLoading: boolean
  error: Error | null
  config: PlatformConfig | null
  features: PlatformFeatures | null
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<IPlatformPlugin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getPlatform = () => {
      try {
        setIsLoading(true)
        setError(null)

        // Platform detection happens in bootstrapApplication()
        // We just retrieve the already-activated platform
        const activePlatform = platformRegistry.getActive()
        setPlatform(activePlatform)

        if (process.env.NODE_ENV === 'development') {
          console.log('[PlatformProvider] Active platform:', activePlatform.name)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Platform retrieval failed')
        setError(error)
        console.error('[PlatformProvider] Error getting platform:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getPlatform()
  }, [])

  const config = platform ? platform.getConfig() : null
  const features = platform ? platform.getFeatures() : null

  const value: PlatformContextType = {
    platform,
    isLoading,
    error,
    config,
    features,
  }

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform(): PlatformContextType {
  const context = useContext(PlatformContext)

  if (!context) {
    throw new Error('[usePlatform] Hook must be used within PlatformProvider')
  }

  return context
}

/**
 * Get active platform
 * Throws if platform not detected
 */
export function usePlatformOrThrow(): IPlatformPlugin {
  const { platform, isLoading, error } = usePlatform()

  if (isLoading) {
    throw new Error('[usePlatform] Platform is still loading')
  }

  if (error) {
    throw error
  }

  if (!platform) {
    throw new Error('[usePlatform] No platform detected')
  }

  return platform
}
