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
 * Get auth strategy from active platform with Dependency Injection.
 * Returns ONLY strategy methods — all state lives in useAuthStore.
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
    if (isLoading || !platform) return null

    if (error) {
      console.error('[useAuth] Platform detection failed:', error)
      return null
    }

    if (platform.id === 'web') {
      if (!strategyRef.current) {
        strategyRef.current = new WebAuthStrategy(wagmiDeps, signFn)
      } else {
        // Sync wagmi deps to cached strategy during render (before effects run).
        // This ensures canAuthenticate is current when the init effect checks it.
        (strategyRef.current as WebAuthStrategy).updateWagmiAccount(wagmiDeps)
      }
    } else if (platform.id === 'base-app') {
      if (!strategyRef.current && miniKitContext) {
        strategyRef.current = new BaseAppAuthStrategy(miniKitContext)
      }
    } else if (platform.id === 'farcaster') {
      if (!strategyRef.current && miniKitContext) {
        strategyRef.current = new FarcasterAuthStrategy(miniKitContext)
      }
    } else {
      console.error(`[useAuth] Unknown platform: ${platform.id}`)
    }

    return strategyRef.current
  }, [platform, isLoading, error, wagmiDeps, signFn, miniKitContext])

  // Sync MiniKit context to cached strategy (mirrors wagmi sync pattern below)
  useEffect(() => {
    if (!miniKitContext || !strategyRef.current) return
    if (platform?.id !== 'base-app' && platform?.id !== 'farcaster') return

    const strategy = strategyRef.current as BaseAppAuthStrategy | FarcasterAuthStrategy
    if (strategy.updateContext) {
      strategy.updateContext(miniKitContext)
    }
  }, [miniKitContext, platform])

  // Auth initialization — all platforms
  useEffect(() => {
    if (!platform) return
    if (hasInitializedRef.current) return
    if (useAuthStore.getState().initialized) return
    if (!strategyRef.current) return

    // Web: wait for wagmi to report wallet as connectable
    if (platform.id === 'web') {
      const webStrategy = strategyRef.current as WebAuthStrategy
      if (!webStrategy.canAuthenticate) return
    }

    hasInitializedRef.current = true

    strategyRef.current.checkAuthStatus().finally(() => {
      const store = useAuthStore.getState()
      if (!store.initialized) {
        store.setInitialized(true)
      }
      store.setLoading(false)
    })
  }, [platform, address, isConnected, miniKitContext])

  // Handle wagmi state changes: sync account + detect address change/disconnect (Web only)
  useEffect(() => {
    if (platform?.id !== 'web') return

    // Sync wagmi account to strategy
    if (strategyRef.current) {
      const webStrategy = strategyRef.current as WebAuthStrategy
      if (webStrategy.updateWagmiAccount) {
        webStrategy.updateWagmiAccount({ address, isConnected })
      }
    }

    // Detect address change or wallet disconnect
    const currentUser = useAuthStore.getState().user
    const previousAddress = previousAddressRef.current

    if (currentUser && currentUser.walletAddress && address && previousAddress && previousAddress !== address) {
      const currentAddress = currentUser.walletAddress.toLowerCase()
      const newAddress = address.toLowerCase()

      if (currentAddress !== newAddress) {
        useAuthStore.getState().logout()
        if (strategyRef.current) {
          strategyRef.current.logout().catch(console.error)
        }
      }
    }

    if (currentUser && !isConnected && previousAddress) {
      useAuthStore.getState().logout()
      if (strategyRef.current) {
        strategyRef.current.logout().catch(console.error)
      }
    }

    previousAddressRef.current = address
  }, [address, isConnected, platform])

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

  return authStrategy!
}
