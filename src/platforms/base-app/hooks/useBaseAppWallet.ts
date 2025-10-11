'use client'

import { useState, useCallback } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'
import { TransactionRequest } from '../../_core/shared/interfaces/IWalletProvider'

export function useBaseAppWallet() {
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
  const chainId = wagmiAccount.chainId || 8453 // Base mainnet

  const connectWallet = useCallback(async () => {
    if (!isConnected) {
      setError('No wallet available in Base App context')
      return
    }
    setError(null)
    console.log('[BaseAppWallet] Wallet is automatically connected in Base App')
  }, [isConnected])

  const disconnectWallet = useCallback(async () => {
    setError(null)
    console.log('[BaseAppWallet] Wallet disconnection handled by Base App')
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

  const getUserProfile = useCallback(() => {
    const user = miniKit.context?.user
    if (!user) return null

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      custody: (user as any).custody,
      verifications: (user as any).verifications
    }
  }, [miniKit.context?.user])

  return {
    // Connection state
    address,
    isConnected,
    chainId,
    balance: null,
    isLoading,
    error,

    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
    sendTransaction,

    // Base App specific info
    userProfile: getUserProfile(),
    custodyWallet: {
      address: custodyAddress,
      type: 'custody' as const
    },
    verificationAddresses: (miniKit.context?.user as any)?.verifications || [],

    // Farcaster context
    farcasterInfo: {
      fid: miniKit.context?.user?.fid,
      username: miniKit.context?.user?.username,
      displayName: miniKit.context?.user?.displayName,
      pfpUrl: miniKit.context?.user?.pfpUrl
    },

    // Client info
    clientInfo: {
      clientFid: miniKit.context?.client?.clientFid,
      clientName: (miniKit.context?.client as any)?.name
    },

    // Utilities
    formatAddress: (addr?: string) => {
      const targetAddr = addr || address
      if (!targetAddr) return 'No address'
      return `${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`
    },

    // Raw context for debugging
    rawContext: miniKit.context,
  }
}
