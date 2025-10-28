'use client'

import { useState, useCallback } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { TransactionRequest } from '../../_core/shared/types'

/**
 * Base App wallet hook using OnchainKit MiniKit
 *
 * SECURITY WARNING:
 * - Context data (addresses, user info) is UNVERIFIED and can be spoofed
 * - Use ONLY for display purposes (UI hints, prefill forms)
 * - For critical operations (transactions, transfers):
 *   * Use MiniKit transaction trays with explicit user confirmation
 *   * Verify addresses server-side
 *   * Never trust client-provided addresses for authorization
 *
 * @see https://docs.base.org/mini-apps/security
 */
export function useBaseAppWallet() {
  const miniKit = useMiniKit()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get address from MiniKit context
  // WARNING: Context addresses are UNVERIFIED - use only for display
  const custodyAddress = (miniKit.context?.user as any)?.custody?.address
  const verifiedAddresses = (miniKit.context?.user as any)?.verifications || []
  const address = custodyAddress || verifiedAddresses[0] || null
  const isConnected = !!address
  const chainId = 8453 // Base mainnet

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
      // Use MiniKit's sign message functionality
      // Note: MiniKit doesn't have direct signMessage API, would need to implement via provider
      throw new Error('Sign message not yet implemented for Base App')
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
      // Note: This would use MiniKit SDK methods when available
      throw new Error('Send transaction not yet implemented for Base App')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getUserProfile = useCallback(() => {
    const user = miniKit.context?.user
    if (!user) return null

    // SECURITY: This data is UNVERIFIED from context
    // Use only for UI display, not for authorization
    return {
      fid: user.fid, // Unverified - for display only
      username: user.username, // Unverified - for display only
      displayName: user.displayName, // Unverified - for display only
      pfpUrl: user.pfpUrl, // Unverified - for display only
      custody: (user as any).custody, // Unverified - for display only
      verifications: (user as any).verifications // Unverified - for display only
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
