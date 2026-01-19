'use client'

import { useMemo, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useSendTransaction, useSignMessage } from 'wagmi'
import { IWalletStrategy } from '@/src/platforms/_core/shared/interfaces/IWalletStrategy'
import { usePlatform } from './usePlatform'
import { WebWalletStrategy } from '@/src/platforms/web/strategies/WebWalletStrategy'
import { BaseAppWalletStrategy } from '@/src/platforms/base-app/strategies/BaseAppWalletStrategy'
import { FarcasterWalletStrategy } from '@/src/platforms/farcaster/strategies/FarcasterWalletStrategy'

/**
 * Get wallet strategy from active platform with Dependency Injection
 * Creates strategy instances with required dependencies from React hooks
 *
 * @returns wallet strategy instance
 * @throws if platform not ready
 */
export function useWallet(): IWalletStrategy {
  const { platform, isLoading, error } = usePlatform()

  // Web platform dependencies
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { sendTransactionAsync } = useSendTransaction()
  const { signMessageAsync } = useSignMessage()

  // Strategy instance management
  const strategyRef = useRef<IWalletStrategy | null>(null)

  // Create strategy with dependency injection
  const walletStrategy = useMemo(() => {
    if (isLoading) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useWallet] Platform is loading, wallet strategy not available yet')
      }
      throw new Error('[useWallet] Platform is still loading')
    }

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[useWallet] Platform error:', error.message)
      }
      throw error
    }

    if (!platform) {
      const err = new Error('[useWallet] No active platform detected')
      if (process.env.NODE_ENV === 'development') {
        console.error(err.message)
      }
      throw err
    }

    try {
      let strategy: IWalletStrategy

      // Create strategy with DI based on platform
      if (platform.id === 'web') {
        // Create wagmi hooks bundle
        const wagmiHooks = {
          address,
          isConnected,
          chainId,
          balance: balance?.value,
          connect: async (connector: any) => connect({ connector }),
          disconnect: async () => disconnect(),
          signMessage: async (message: string) => signMessageAsync({ message }),
          sendTransaction: async (tx: any) => sendTransactionAsync(tx),
          connectors: [...connectors] // Convert readonly to mutable array
        }

        // Always create new strategy instance (lightweight, contains current state)
        strategy = new WebWalletStrategy(wagmiHooks)
        strategyRef.current = strategy
      } else if (platform.id === 'base-app') {
        // BaseApp uses MiniKit SDK - no dependencies needed
        if (!strategyRef.current) {
          strategy = new BaseAppWalletStrategy()
          strategyRef.current = strategy
        } else {
          strategy = strategyRef.current
        }
      } else if (platform.id === 'farcaster') {
        // Farcaster uses MiniKit SDK - no dependencies needed
        if (!strategyRef.current) {
          strategy = new FarcasterWalletStrategy()
          strategyRef.current = strategy
        } else {
          strategy = strategyRef.current
        }
      } else {
        throw new Error(`[useWallet] Unknown platform: ${platform.id}`)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          '[useWallet] Created wallet strategy for platform:',
          platform.name,
          typeof strategy
        )
      }

      return strategy
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create wallet strategy')
      if (process.env.NODE_ENV === 'development') {
        console.error('[useWallet] Error creating wallet strategy:', error.message)
      }
      throw error
    }
  }, [
    platform,
    isLoading,
    error,
    address,
    isConnected,
    chainId,
    balance,
    connect,
    disconnect,
    signMessageAsync,
    sendTransactionAsync,
    connectors
  ])

  return walletStrategy
}
