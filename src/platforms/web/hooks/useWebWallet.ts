'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useSendTransaction } from 'wagmi'
import { usePlatform } from '../../PlatformContext'
import { WebPlatformProvider } from '../WebPlatformProvider'
import { TransactionRequest } from '../../shared/interfaces/IWalletProvider'

export function useWebWallet() {
  const { provider } = usePlatform()
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { sendTransactionAsync } = useSendTransaction()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get Web platform provider
  const webProvider = provider instanceof WebPlatformProvider ? provider : null
  const walletProvider = webProvider?.getWalletProvider()
  
  const connectWallet = useCallback(async () => {
    if (!walletProvider || connectors.length === 0) {
      setError('No wallet connectors available')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      await walletProvider.connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }, [walletProvider, connectors])
  
  const disconnectWallet = useCallback(async () => {
    if (!walletProvider) return
    
    try {
      setError(null)
      await walletProvider.disconnect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    }
  }, [walletProvider])
  
  const signMessage = useCallback(async (message: string) => {
    if (!walletProvider) {
      throw new Error('Wallet provider not available')
    }
    
    try {
      setError(null)
      return await walletProvider.signMessage(message)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign message'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }, [walletProvider])
  
  const sendTransaction = useCallback(async (tx: TransactionRequest) => {
    if (!walletProvider) {
      throw new Error('Wallet provider not available')
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const hash = await walletProvider.sendTransaction(tx)
      return hash
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [walletProvider])
  
  // Get available connectors with metadata
  const getConnectors = useCallback(() => {
    return connectors.map(connector => ({
      id: connector.id,
      name: connector.name,
      icon: connector.icon,
      type: connector.type,
      ready: connector.ready,
    }))
  }, [connectors])
  
  // Get wallet capabilities from the platform
  const getWalletCapabilities = useCallback(() => {
    if (!webProvider) return null
    
    const capabilities = webProvider.getBrowserCapabilities()
    return {
      ...capabilities,
      hasWallet: 'ethereum' in window,
      hasWeb3: 'web3' in window,
      connectors: getConnectors(),
    }
  }, [webProvider, getConnectors])
  
  // Format balance for display
  const formatBalance = useCallback((decimals = 4) => {
    if (!balance) return '0'
    
    const value = parseFloat(balance.formatted)
    return value.toFixed(decimals)
  }, [balance])
  
  // Network information
  const getNetworkInfo = useCallback(() => {
    return {
      chainId,
      isSupported: chainId === 1 || chainId === 11155111, // Mainnet or Sepolia
      networkName: chainId === 1 ? 'Ethereum Mainnet' : 
                   chainId === 11155111 ? 'Sepolia Testnet' : 
                   'Unknown Network'
    }
  }, [chainId])
  
  return {
    // Connection state
    address,
    isConnected,
    chainId,
    balance: balance?.value || null,
    balanceFormatted: balance?.formatted || '0',
    isLoading,
    error,
    
    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
    sendTransaction,
    
    // Utilities
    getConnectors,
    getWalletCapabilities,
    formatBalance,
    getNetworkInfo,
    
    // Raw data
    rawBalance: balance,
    connectors,
  }
}