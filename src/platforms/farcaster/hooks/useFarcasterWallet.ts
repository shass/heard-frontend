'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlatform } from '../../PlatformContext'
import { FarcasterPlatformProvider } from '../FarcasterPlatformProvider'
import { TransactionRequest } from '../../shared/interfaces/IWalletProvider'

export function useFarcasterWallet() {
  const { provider } = usePlatform()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [networkInfo, setNetworkInfo] = useState<any>(null)
  
  // Get Farcaster platform provider
  const farcasterProvider = provider instanceof FarcasterPlatformProvider ? provider : null
  const walletProvider = farcasterProvider?.getWalletProvider()
  const miniAppSdk = farcasterProvider?.getMiniAppSdk()
  
  // Set up wallet event listeners
  useEffect(() => {
    if (!walletProvider) return
    
    const unsubscribeAccount = walletProvider.onAccountChange((account) => {
      setAddress(account)
      if (account) {
        // Refresh balance when account changes
        walletProvider.getBalance().then(setBalance).catch(console.error)
      } else {
        setBalance(null)
      }
    })
    
    const unsubscribeChain = walletProvider.onChainChange((newChainId) => {
      setChainId(newChainId)
      // Refresh network info when chain changes
      if ('getNetworkInfo' in walletProvider) {
        (walletProvider as any).getNetworkInfo().then(setNetworkInfo).catch(console.error)
      }
    })
    
    return () => {
      unsubscribeAccount()
      unsubscribeChain()
    }
  }, [walletProvider])
  
  // Initialize wallet state
  useEffect(() => {
    if (!walletProvider) return
    
    const initializeWallet = async () => {
      try {
        const currentAddress = await walletProvider.getAddress()
        const currentChainId = await walletProvider.getChainId()
        const currentBalance = await walletProvider.getBalance()
        
        setAddress(currentAddress)
        setChainId(currentChainId)
        setBalance(currentBalance)
        
        // Get network info if available
        if ('getNetworkInfo' in walletProvider) {
          const info = await (walletProvider as any).getNetworkInfo()
          setNetworkInfo(info)
        }
      } catch (error) {
        console.error('Failed to initialize wallet state:', error)
      }
    }
    
    initializeWallet()
  }, [walletProvider])
  
  const connectWallet = useCallback(async () => {
    if (!walletProvider) {
      setError('Wallet provider not available')
      return
    }
    
    try {
      setError(null)
      setIsLoading(true)
      
      const connection = await walletProvider.connect()
      
      setAddress(connection.address)
      setChainId(connection.chainId)
      
      // Get balance after connection
      const currentBalance = await walletProvider.getBalance()
      setBalance(currentBalance)
      
      console.log('[FarcasterWallet] Connected successfully')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [walletProvider])
  
  const disconnectWallet = useCallback(async () => {
    if (!walletProvider) return
    
    try {
      setError(null)
      await walletProvider.disconnect()
      setAddress(null)
      setChainId(null)
      setBalance(null)
      setNetworkInfo(null)
      console.log('[FarcasterWallet] Disconnected successfully')
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
  
  const signTypedData = useCallback(async (data: any) => {
    if (!walletProvider) {
      throw new Error('Wallet provider not available')
    }
    
    try {
      setError(null)
      return await walletProvider.signTypedData(data)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sign typed data'
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
      
      // Refresh balance after transaction
      const newBalance = await walletProvider.getBalance()
      setBalance(newBalance)
      
      return hash
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send transaction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [walletProvider])
  
  const sendBatchTransaction = useCallback(async (transactions: TransactionRequest[]) => {
    if (!walletProvider || !('sendBatchTransaction' in walletProvider)) {
      throw new Error('Batch transactions not supported')
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await (walletProvider as any).sendBatchTransaction(transactions)
      
      // Refresh balance after transactions
      const newBalance = await walletProvider.getBalance()
      setBalance(newBalance)
      
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send batch transaction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [walletProvider])
  
  // Get Ethereum provider
  const getEthereumProvider = useCallback(() => {
    if (!walletProvider || !('getEthereumProvider' in walletProvider)) {
      return null
    }
    
    return (walletProvider as any).getEthereumProvider()
  }, [walletProvider])
  
  // Get wallet capabilities
  const getWalletCapabilities = useCallback(() => {
    if (!walletProvider || !('getWalletCapabilities' in walletProvider)) {
      return null
    }
    
    return (walletProvider as any).getWalletCapabilities()
  }, [walletProvider])
  
  // Check if batch transactions are supported
  const supportsBatchTransactions = useCallback(() => {
    if (!walletProvider || !('supportsBatchTransactions' in walletProvider)) {
      return false
    }
    
    return (walletProvider as any).supportsBatchTransactions()
  }, [walletProvider])
  
  // Refresh wallet data
  const refreshWalletData = useCallback(async () => {
    if (!walletProvider) return
    
    try {
      const [currentAddress, currentChainId, currentBalance] = await Promise.all([
        walletProvider.getAddress(),
        walletProvider.getChainId(),
        walletProvider.getBalance()
      ])
      
      setAddress(currentAddress)
      setChainId(currentChainId)
      setBalance(currentBalance)
      
      // Update network info if available
      if ('getNetworkInfo' in walletProvider) {
        const info = await (walletProvider as any).getNetworkInfo()
        setNetworkInfo(info)
      }
    } catch (error) {
      console.error('Failed to refresh wallet data:', error)
    }
  }, [walletProvider])
  
  return {
    // Connection state
    address,
    isConnected: !!address,
    chainId,
    balance,
    isLoading,
    error,
    networkInfo,
    
    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
    signTypedData,
    sendTransaction,
    sendBatchTransaction,
    refreshWalletData,
    
    // Farcaster Mini App specific features
    ethereumProvider: getEthereumProvider(),
    walletCapabilities: getWalletCapabilities(),
    supportsBatchTransactions: supportsBatchTransactions(),
    
    // Network utilities
    networkName: networkInfo?.networkName || (chainId ? `Chain ${chainId}` : 'Unknown'),
    isTestnet: networkInfo?.isTestnet || false,
    blockExplorer: networkInfo?.blockExplorer || '',
    
    // Environment info
    isMiniApp: farcasterProvider?.isInMiniApp() || false,
    isFarcasterClient: farcasterProvider?.isInFarcasterClient() || false,
    
    // Utilities
    formatAddress: (addr?: string) => {
      const targetAddr = addr || address
      if (!targetAddr) return 'No address'
      return `${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`
    },
    
    formatBalance: (bal?: bigint) => {
      const targetBalance = bal || balance
      if (!targetBalance) return '0 ETH'
      
      const ethValue = Number(targetBalance) / 1e18
      return `${ethValue.toFixed(4)} ETH`
    }
  }
}