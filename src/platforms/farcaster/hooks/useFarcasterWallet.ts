'use client'

import { useState, useCallback } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'
import { TransactionRequest } from '../../shared/interfaces/IWalletProvider'

export function useFarcasterWallet() {
  const miniKit = useMiniKit()
  const wagmiAccount = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const { signMessageAsync } = useSignMessage()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get address from MiniKit context or wagmi
  const custodyAddress = (miniKit.context?.user as any)?.custody?.address
  const address = custodyAddress || wagmiAccount.address || null
  const isConnected = !!address
  const chainId = wagmiAccount.chainId || 8453

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
      return await signMessageAsync({ message })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign message'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [signMessageAsync])

  const sendTransaction = useCallback(async (tx: TransactionRequest) => {
    try {
      setIsLoading(true)
      setError(null)

      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : undefined,
        data: tx.data as `0x${string}` | undefined,
      })
      return hash
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [sendTransactionAsync])

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
