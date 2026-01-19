'use client'

import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useSafeMiniKit } from './useSafeMiniKit'
import { IAuthStrategy } from '@/src/platforms/_core/shared/interfaces/IAuthStrategy'
import { usePlatform } from './usePlatform'
import { WebAuthStrategy } from '@/src/platforms/web/strategies/WebAuthStrategy'
import { BaseAppAuthStrategy } from '@/src/platforms/base-app/strategies/BaseAppAuthStrategy'
import { FarcasterAuthStrategy } from '@/src/platforms/farcaster/strategies/FarcasterAuthStrategy'
import { useAuthStore } from '@/lib/store'

/**
 * Get auth strategy from active platform with Dependency Injection
 * Creates strategy instances with required dependencies from React hooks
 *
 * @returns auth strategy instance
 * @throws if platform not ready
 */
export function useAuth(): IAuthStrategy {
  const { platform, isLoading, error } = usePlatform()

  // Web platform dependencies
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  // BaseApp/Farcaster platform dependencies (safe for Web platform)
  const { context: miniKitContext } = useSafeMiniKit()

  // Strategy instance management
  const strategyRef = useRef<IAuthStrategy | null>(null)
  const previousAddressRef = useRef<string | undefined>(undefined)
  const hasInitializedRef = useRef(false)
  const wasConnectedRef = useRef(false)
  const hasCheckedTokenRef = useRef(false)

  // Memoize wagmi dependencies to prevent unnecessary strategy recreations
  const wagmiDeps = useMemo(
    () => ({ address, isConnected }),
    [address, isConnected]
  )

  // Memoize sign message function to prevent unnecessary strategy recreations
  const signFn = useCallback(
    async (message: string) => signMessageAsync({ message }),
    [signMessageAsync]
  )

  // Create strategy with dependency injection
  const authStrategy = useMemo(() => {
    if (isLoading) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useAuth] Platform is loading, auth strategy not available yet')
      }
      throw new Error('[useAuth] Platform is still loading')
    }

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[useAuth] Platform error:', error.message)
      }
      throw error
    }

    if (!platform) {
      const err = new Error('[useAuth] No active platform detected')
      if (process.env.NODE_ENV === 'development') {
        console.error(err.message)
      }
      throw err
    }

    try {
      let strategy: IAuthStrategy

      // Create strategy with DI based on platform
      if (platform.id === 'web') {
        // Create strategy instance only once
        if (!strategyRef.current) {
          strategy = new WebAuthStrategy(
            wagmiDeps,
            signFn,
            true // checkAuthOnInit
          )
          strategyRef.current = strategy

          if (process.env.NODE_ENV === 'development') {
            console.log('[useAuth] Created auth strategy for platform:', platform.name)
          }
        } else {
          strategy = strategyRef.current
        }
      } else if (platform.id === 'base-app') {
        // BaseApp uses MiniKit SDK
        if (!miniKitContext) {
          throw new Error('[useAuth] MiniKit context not available for BaseApp')
        }
        // Always create new strategy with current context
        strategy = new BaseAppAuthStrategy(miniKitContext)
        strategyRef.current = strategy

        if (process.env.NODE_ENV === 'development') {
          console.log('[useAuth] Created auth strategy for platform:', platform.name)
        }
      } else if (platform.id === 'farcaster') {
        // Farcaster uses MiniKit SDK
        if (!miniKitContext) {
          throw new Error('[useAuth] MiniKit context not available for Farcaster')
        }
        // Always create new strategy with current context
        strategy = new FarcasterAuthStrategy(miniKitContext)
        strategyRef.current = strategy

        if (process.env.NODE_ENV === 'development') {
          console.log('[useAuth] Created auth strategy for platform:', platform.name)
        }
      } else {
        throw new Error(`[useAuth] Unknown platform: ${platform.id}`)
      }

      return strategy
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create auth strategy')
      if (process.env.NODE_ENV === 'development') {
        console.error('[useAuth] Error creating auth strategy:', error.message)
      }
      throw error
    }
  }, [platform, isLoading, error, wagmiDeps, signFn, miniKitContext])

  // Update wagmi account when it changes (Web platform only)
  useEffect(() => {
    if (platform?.id === 'web' && strategyRef.current) {
      const webStrategy = strategyRef.current as WebAuthStrategy
      if (webStrategy.updateWagmiAccount) {
        webStrategy.updateWagmiAccount({ address, isConnected })
      }
    }
  }, [address, isConnected, platform])

  // Handle wallet address changes - logout if address changes (Web platform only)
  useEffect(() => {
    if (platform?.id !== 'web') return

    if (!hasInitializedRef.current) {
      if (address && isConnected) {
        previousAddressRef.current = address
        hasInitializedRef.current = true
        wasConnectedRef.current = true
      }
      return
    }

    if (isConnected && !wasConnectedRef.current) {
      wasConnectedRef.current = true
    }

    const currentUser = useAuthStore.getState().user
    const previousAddress = previousAddressRef.current

    // If we have a user and the address changed, logout
    if (currentUser && currentUser.walletAddress && address && previousAddress !== address) {
      const currentAddress = currentUser.walletAddress.toLowerCase()
      const newAddress = address.toLowerCase()

      if (currentAddress !== newAddress) {
        useAuthStore.getState().logout()
        if (strategyRef.current) {
          strategyRef.current.logout().catch(console.error)
        }
      }
    }

    // If wallet disconnected, logout
    if (currentUser && !isConnected && wasConnectedRef.current) {
      useAuthStore.getState().logout()
      if (strategyRef.current) {
        strategyRef.current.logout().catch(console.error)
      }
      wasConnectedRef.current = false
    }

    previousAddressRef.current = address
  }, [address, isConnected, platform])

  // Check auth status on mount - ONLY if not already initialized globally (Web platform only)
  useEffect(() => {
    if (platform?.id !== 'web') return

    const { initialized, isAuthStrategyReady, setAuthStrategyReady } = useAuthStore.getState()

    if (initialized || isAuthStrategyReady) {
      return
    }

    const webStrategy = strategyRef.current as WebAuthStrategy
    if (!webStrategy?.canAuthenticate) return

    setAuthStrategyReady(true)
  }, [platform])

  // Check stored token on mount for BaseApp/Farcaster
  useEffect(() => {
    if (platform?.id !== 'base-app' && platform?.id !== 'farcaster') return
    if (!miniKitContext || hasCheckedTokenRef.current) return

    const { isAuthStrategyReady, setAuthStrategyReady } = useAuthStore.getState()
    if (isAuthStrategyReady) {
      hasCheckedTokenRef.current = true
      return
    }

    hasCheckedTokenRef.current = true
    setAuthStrategyReady(true)

    // Check for stored token
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken && strategyRef.current) {
        strategyRef.current.checkAuthStatus?.()
      }
    }
  }, [platform, miniKitContext])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (strategyRef.current) {
        const strategy = strategyRef.current as any
        if (strategy.destroy) {
          strategy.destroy()
        }
      }
    }
  }, [])

  return authStrategy
}
