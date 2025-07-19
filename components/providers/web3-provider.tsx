'use client'

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { env } from '@/lib/env'
import React from 'react';

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

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Import error handler dynamically
        const { parseApiError } = require('@/lib/error-handler')
        const appError = parseApiError(error)

        // Only retry retryable errors, max 3 times
        return appError.retryable && failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        const { parseApiError } = require('@/lib/error-handler')
        const appError = parseApiError(error)

        // Only retry network errors for mutations, max 2 times
        return appError.code === 'NETWORK_ERROR' && failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
  logger: {
    log: () => {}, // Suppress logs in development
    warn: () => {},
    error: () => {},
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
          coolMode={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
