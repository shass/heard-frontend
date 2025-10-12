'use client'

import { useState, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useSendTransaction, useSignMessage } from 'wagmi'
import { TransactionRequest } from '../../_core/shared/types'
import { IWalletStrategy } from '../../_core/shared/interfaces/IWalletStrategy'

export function useWebWalletStrategy(): IWalletStrategy {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { sendTransactionAsync } = useSendTransaction()
  const { signMessageAsync } = useSignMessage()

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
