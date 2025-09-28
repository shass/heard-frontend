'use client'

import React from 'react';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mainnet, polygon, bsc, base } from 'wagmi/chains'
import { http } from 'wagmi'
import { env } from '@/lib/env'
import '@rainbow-me/rainbowkit/styles.css'

// Функция определения контекста Base Mini App
function isBaseAppContext(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.location.hostname.includes('base.org') ||
    window.location.hostname.includes('farcaster.xyz') ||
    /Base|Farcaster|Warpcast/i.test(navigator.userAgent) ||
    // Проверяем наличие MiniKit в window
    'miniKit' in window
  )
}

// Web3 configuration optimized for mobile
export const config = getDefaultConfig({
  appName: env.APP_NAME,
  projectId: env.WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [mainnet, base, polygon, bsc] as const,
  ssr: true,
  batch: {
    multicall: true,
  },
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
}) as any

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
})

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions={true}
          coolMode={false}
          locale="en-US"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Export query client for use in other components
export { queryClient }
