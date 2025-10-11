'use client'

import { useState, useCallback } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { TransactionRequest } from '../../_core/shared/types'

export function useFarcasterWallet() {
  const miniKit = useMiniKit()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get address from MiniKit context
  const custodyAddress = (miniKit.context?.user as any)?.custody?.address
  const address = custodyAddress || null
  const isConnected = !!address
  const chainId = 8453

  const connectWallet = useCallback(async () => {
    if (!isConnected) {
      setError('No wallet available in Farcaster context')
      return
    }
    setError(null)
    console.log('[FarcasterWallet] Wallet is automatically connected')
  }, [isConnected])

  const disconnectWallet = useCallback(async () => {
    setError(null)
    console.log('[FarcasterWallet] Wallet disconnection handled by Farcaster')
  }, [])

  const signMessage = useCallback(async (message: string) => {
    try {
      setError(null)
      // Use MiniKit's sign message functionality
      throw new Error('Sign message not yet implemented for Farcaster')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign message'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [])

  const sendTransaction = useCallback(async (tx: TransactionRequest) => {
    try {
      setIsLoading(true)
      setError(null)

      // Use MiniKit's send transaction functionality
      throw new Error('Send transaction not yet implemented for Farcaster')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    address,
    isConnected,
    chainId,
    balance: null,
    isLoading,
    error,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
    sendTransaction,
    custodyWallet: {
      address: custodyAddress,
      type: 'custody' as const
    },
    farcasterInfo: {
      fid: miniKit.context?.user?.fid,
      username: miniKit.context?.user?.username,
      displayName: miniKit.context?.user?.displayName,
      pfpUrl: miniKit.context?.user?.pfpUrl
    },
    rawContext: miniKit.context,
  }
}
