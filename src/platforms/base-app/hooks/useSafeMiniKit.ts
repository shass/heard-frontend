'use client'

import { useEffect, useState } from 'react'

// Type definitions for MiniKit
interface MiniKitUser {
  fid?: number
  username?: string
  displayName?: string
  pfpUrl?: string
  custody?: {
    address?: string
  }
  verifications?: string[]
}

interface MiniKitClient {
  clientFid?: number
  name?: string
}

interface MiniKitContext {
  user?: MiniKitUser
  client?: MiniKitClient
}

interface MiniKitHook {
  context?: MiniKitContext
  isLoading?: boolean
  error?: Error | null
}

interface AuthenticateHook {
  signIn?: (params: any) => Promise<any>
  signOut?: () => Promise<void>
  isLoading?: boolean
  error?: Error | null
}

interface SafeMiniKitResult {
  miniKit: MiniKitHook | null
  authenticate: AuthenticateHook | null
  isAvailable: boolean
  error: string | null
  checkAvailability: () => void
}

/**
 * Safe wrapper for OnchainKit MiniKit hooks
 * Handles cases where OnchainKit is not available or not in MiniKit environment
 */
export function useSafeMiniKit(): SafeMiniKitResult {
  const [isAvailable, setIsAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [miniKit, setMiniKit] = useState<MiniKitHook | null>(null)
  const [authenticate, setAuthenticate] = useState<AuthenticateHook | null>(null)
  
  const checkAvailability = () => {
    try {
      // Try to import OnchainKit dynamically
      const onchainKit = require('@coinbase/onchainkit/minikit')
      
      if (!onchainKit) {
        throw new Error('OnchainKit module not found')
      }
      
      // Check if hooks exist
      if (!onchainKit.useMiniKit || !onchainKit.useAuthenticate) {
        throw new Error('MiniKit hooks not found in OnchainKit')
      }
      
      // Try to use the hooks (they will fail if not in proper context)
      try {
        const miniKitResult = onchainKit.useMiniKit()
        const authResult = onchainKit.useAuthenticate()
        
        setMiniKit(miniKitResult)
        setAuthenticate(authResult)
        setIsAvailable(true)
        setError(null)
        
        console.log('[SafeMiniKit] MiniKit hooks available and working')
      } catch (hookError: any) {
        // Hooks exist but can't be used (probably not in MiniKit environment)
        console.warn('[SafeMiniKit] MiniKit hooks exist but cannot be used:', hookError.message)
        setError('Not in MiniKit environment')
        setIsAvailable(false)
      }
    } catch (importError: any) {
      console.warn('[SafeMiniKit] OnchainKit not available:', importError.message)
      setError('OnchainKit not installed or not available')
      setIsAvailable(false)
    }
  }
  
  useEffect(() => {
    checkAvailability()
  }, [])
  
  // Return safe wrapper
  return {
    miniKit,
    authenticate,
    isAvailable,
    error,
    checkAvailability
  }
}

/**
 * Check if we're in a Base App / MiniKit environment
 */
export function isInMiniKitEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  
  // Multiple ways to detect MiniKit environment
  const checks = [
    // Check for MiniKit global
    () => !!(window as any)?.MiniKit,
    
    // Check for webkit message handlers
    () => !!(window as any)?.webkit?.messageHandlers?.minikit,
    
    // Check for Coinbase referrer
    () => typeof document !== 'undefined' && 
         (document.referrer.includes('coinbase.com') ||
          document.referrer.includes('base.org')),
    
    // Check for specific user agents
    () => typeof navigator !== 'undefined' &&
         (navigator.userAgent.includes('CoinbaseWallet') ||
          navigator.userAgent.includes('BaseApp')),
    
    // Check for ethereum provider with specific properties
    () => !!(window as any)?.ethereum?.isCoinbaseWallet
  ]
  
  // Return true if any check passes
  return checks.some(check => {
    try {
      return check()
    } catch {
      return false
    }
  })
}

/**
 * Get MiniKit environment info for debugging
 */
export function getMiniKitEnvironmentInfo() {
  if (typeof window === 'undefined') {
    return {
      isSSR: true,
      environment: 'server'
    }
  }
  
  return {
    isSSR: false,
    environment: 'client',
    hasMinKit: !!(window as any)?.MiniKit,
    hasWebkitHandlers: !!(window as any)?.webkit?.messageHandlers?.minikit,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    isCoinbaseWallet: !!(window as any)?.ethereum?.isCoinbaseWallet,
    isInMiniKitEnvironment: isInMiniKitEnvironment()
  }
}