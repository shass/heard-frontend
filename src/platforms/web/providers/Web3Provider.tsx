'use client'

import React from 'react';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mainnet, polygon, bsc, base, sepolia } from 'wagmi/chains'
import { http } from 'wagmi'
import { env } from '@/lib/env'
import { BringIDProvider } from '@/providers/BringIDProvider'
import '@rainbow-me/rainbowkit/styles.css'

// Web3 configuration optimized for mobile
export const config = getDefaultConfig({
  appName: env.APP_NAME,
  projectId: env.WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [mainnet, base, polygon, bsc, ...(env.ENABLE_TESTNETS ? [sepolia] : [])] as const,
  ssr: true,
  batch: {
    multicall: true,
  },
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [sepolia.id]: http(),
  },
}) as any

interface Web3ProviderProps {
  children: React.ReactNode
}

// Create a client for React Query with aggressive caching settings - moved outside component
let queryClientInstance: QueryClient | null = null

function getQueryClient() {
  if (queryClientInstance) return queryClientInstance

  queryClientInstance = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Default to not refetch on mount - use cache
        refetchOnReconnect: false, // Don't automatically refetch on reconnect
        retry: (failureCount, error) => {
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const status = (error as { statusCode: number }).statusCode
            if (status === 401 || status === 403) return false
          }
          return failureCount < 3
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
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const status = (error as { statusCode: number }).statusCode
            if (status === 401 || status === 403) return false
          }
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        networkMode: 'online',
      },
    },
  })

  return queryClientInstance
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const queryClient = getQueryClient()

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions={true}
          coolMode={false}
          locale="en-US"
        >
          <BringIDProvider>
            {children}
          </BringIDProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Export query client for use in other components
export const queryClient = getQueryClient()
