'use client'

import { useState, useCallback } from 'react'
import { TransactionRequest } from '../../_core/shared/types'
import { usePlatformDetector } from '../../_core/PlatformDetectorProvider'
import { Platform } from '../../config'

// Safe wrapper for wagmi hooks - only load on Web platform
function useWagmiWalletSafe() {
  const { platform } = usePlatformDetector()

  if (platform !== Platform.WEB) {
    // Return safe defaults for non-Web platforms
    return {
      address: undefined,
      isConnected: false,
      chainId: undefined,
      connect: async () => {},
      connectors: [],
      disconnect: async () => {},
      balance: undefined,
      sendTransactionAsync: async () => { throw new Error('Wagmi not available') },
      signMessageAsync: async () => { throw new Error('Wagmi not available') }
    }
  }

  // Only import and use wagmi on Web platform
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { useAccount, useConnect, useDisconnect, useBalance, useSendTransaction, useSignMessage } = require('wagmi')
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { address, isConnected, chainId } = useAccount()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { connect, connectors } = useConnect()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { disconnect } = useDisconnect()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: balance } = useBalance({ address })
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { sendTransactionAsync } = useSendTransaction()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { signMessageAsync } = useSignMessage()

  return { address, isConnected, chainId, connect, connectors, disconnect, balance, sendTransactionAsync, signMessageAsync }
}

export function useWebWallet() {
  const { address, isConnected, chainId, connect, connectors, disconnect, balance, sendTransactionAsync, signMessageAsync } = useWagmiWalletSafe()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectWallet = useCallback(async () => {
    if (connectors.length === 0) {
      setError('No wallet connectors available')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await connect({ connector: connectors[0] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }, [connect, connectors])

  const disconnectWallet = useCallback(async () => {
    try {
      setError(null)
      await disconnect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    }
  }, [disconnect])

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

  const getConnectors = useCallback(() => {
    return connectors.map((connector: any) => ({
      id: connector.id,
      name: connector.name,
      icon: connector.icon,
      type: connector.type,
      ready: true,
    }))
  }, [connectors])

  return {
    // Wallet state
    address,
    isConnected,
    chainId,
    balance: balance?.value.toString(),
    isLoading,
    error,

    // Wallet actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
    sendTransaction,
    getConnectors,

    // Capabilities
    canConnect: connectors.length > 0,
    canSignMessage: isConnected,
    canSendTransaction: isConnected,
  }
}
