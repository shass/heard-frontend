// Web3 configuration and providers

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { env } from '@/lib/env'

// Web3 configuration
export const web3Config = getDefaultConfig({
  appName: env.APP_NAME,
  projectId: env.WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, bsc],
  ssr: true, // Next.js SSR support
})

// Chain configurations
export const supportedChains = {
  1: {
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
  },
  137: {
    name: 'Polygon',
    currency: 'MATIC', 
    explorerUrl: 'https://polygonscan.com',
  },
  56: {
    name: 'BNB Smart Chain',
    currency: 'BNB',
    explorerUrl: 'https://bscscan.com',
  },
} as const

// Utility functions
export const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const chain = supportedChains[chainId as keyof typeof supportedChains]
  if (!chain) return '#'
  return `${chain.explorerUrl}/tx/${txHash}`
}

export * from './wagmi-config'