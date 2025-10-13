'use client'

import { useState, useEffect, useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { IWalletStrategy } from '@/src/platforms/_core/shared/interfaces/IWalletStrategy'
import { TransactionRequest } from '@/src/platforms/_core/shared/types'

export function useBaseAppWalletStrategy(): IWalletStrategy {
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get wallet address from Ethereum provider (Base Account is auto-connected)
  useEffect(() => {
    const getAddress = async () => {
      try {
        const provider = sdk.wallet.ethProvider
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' })
          setAddress(accounts[0])
        }
      } catch (err) {
        console.error('[BaseAppWalletStrategy] Failed to get address:', err)
      }
    }
    getAddress()
  }, [])

  const connect = useCallback(async () => {
    // Base Account is automatically connected, nothing to do
  }, [])

  const disconnect = useCallback(async () => {
    // Cannot disconnect from Base Account
  }, [])

  const signMessage = useCallback(async (message: string): Promise<string> => {
    try {
      const provider = sdk.wallet.ethProvider
      if (!provider || !address) {
        throw new Error('Wallet not available')
      }

      const signature = await provider.request({
        method: 'personal_sign',
        params: [message as `0x${string}`, address as `0x${string}`]
      }) as string

      return signature
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign message'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [address])

  const sendTransaction = useCallback(async (tx: TransactionRequest): Promise<string> => {
    try {
      setIsLoading(true)
      setError(null)

      const provider = sdk.wallet.ethProvider
      if (!provider || !address) {
        throw new Error('Wallet not available')
      }

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address as `0x${string}`,
          to: tx.to as `0x${string}` | undefined,
          value: tx.value?.toString() as `0x${string}` | undefined,
          data: tx.data as `0x${string}` | undefined,
        }]
      }) as string

      return txHash
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  const getConnectors = useCallback(() => {
    return [{
      id: 'base-account',
      name: 'Base Account',
      type: 'injected',
      ready: true,
    }]
  }, [])

  return {
    address,
    isConnected: !!address, // Connected if we have an address
    chainId: 8453, // Base mainnet
    balance: undefined,
    isLoading,
    error,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    getConnectors,
    canConnect: false, // Already connected, no need to connect
    canSignMessage: true,
    canSendTransaction: true,
  }
}
