'use client'

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { env } from '@/lib/env'
import { createCacheWarmer } from '@/lib/cache-warmer'
import React, { useEffect, useState } from 'react';

import '@rainbow-me/rainbowkit/styles.css'

// Web3 configuration
const config = getDefaultConfig({
  appName: env.APP_NAME,
  projectId: env.WALLETCONNECT_PROJECT_ID || 'demo', // Fallback for development
  chains: [mainnet, polygon, bsc],
  ssr: true,
  batch: {
    multicall: true,
  },
})

// Create a client for React Query with aggressive caching settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Default to not refetch on mount - use cache
      refetchOnReconnect: false, // Don't automatically refetch on reconnect
      retry: (failureCount, error) => {
        // Import error handler dynamically
        const { parseApiError } = require('@/lib/error-handler')
        const appError = parseApiError(error)

        // Only retry retryable errors, max 3 times
        return appError.retryable && failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in memory much longer
      // Prioritize showing cached data over loading states
      notifyOnChangeProps: ['data', 'error'], // Don't notify loading state changes by default
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error) => {
        const { parseApiError } = require('@/lib/error-handler')
        const appError = parseApiError(error)

        // Only retry network errors for mutations, max 2 times
        return appError.code === 'NETWORK_ERROR' && failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'online',
    },
  },
  logger: {
    log: () => {}, // Suppress logs in development
    warn: () => {},
    error: () => {},
  },
})

// Initialize cache warmer
const cacheWarmer = createCacheWarmer(queryClient)

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [cacheWarmed, setCacheWarmed] = useState(false)

  // Warm cache on app initialization
  useEffect(() => {
    let mounted = true

    const warmCache = async () => {
      try {
        // Small delay to ensure React is ready, but not too long
        await new Promise(resolve => setTimeout(resolve, 50))
        
        if (mounted) {
          // Start cache warming in background
          cacheWarmer.warmCache()
            .then(() => {
              if (mounted) setCacheWarmed(true)
            })
            .catch((error) => {
              console.warn('Cache warming failed:', error)
              if (mounted) setCacheWarmed(true) // Still mark as complete
            })
        }
      } catch (error) {
        console.warn('Cache warming setup failed:', error)
        if (mounted) setCacheWarmed(true)
      }
    }

    // Start immediately, don't wait
    warmCache()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions={true}
          coolMode={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Export cache warmer instance for use in other components
export { cacheWarmer, queryClient }
