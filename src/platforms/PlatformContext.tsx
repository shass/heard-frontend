'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
  
  useEffect(() => {
    const initializePlatform = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const manager = PlatformManager.getInstance()
        await manager.initialize()
        
        const currentPlatform = manager.getCurrentPlatform()
        const currentProvider = manager.getCurrentProvider()
        const info = manager.getPlatformInfo()
        
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
  }, [])
  
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