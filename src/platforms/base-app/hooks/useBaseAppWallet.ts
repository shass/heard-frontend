'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'
import { usePlatform } from '../../PlatformContext'
import { BaseAppPlatformProvider } from '../BaseAppPlatformProvider'
import { TransactionRequest } from '../../shared/interfaces/IWalletProvider'

export function useBaseAppWallet() {
  const { provider } = usePlatform()
  const miniKit = useMiniKit()
  const account = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const { signMessageAsync } = useSignMessage()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get Base App platform provider
  const baseAppProvider = provider instanceof BaseAppPlatformProvider ? provider : null
  const walletProvider = baseAppProvider?.getWalletProvider()
  
  // Initialize provider with hooks
  useEffect(() => {
    if (baseAppProvider && miniKit) {
      const hooks = {
        miniKit,
        account,
        sendTransaction: { sendTransactionAsync },
        signMessage: { signMessageAsync }
      }
      
      baseAppProvider.initializeWithMiniKitHooks(hooks)
    }
  }, [baseAppProvider, miniKit, account, sendTransactionAsync, signMessageAsync])
  
  // Wallet connection state (automatic in Base App)
  const isConnected = !!(
    (miniKit.context?.user as any)?.custody?.address || 
    account.address
  )
  
  const address = (miniKit.context?.user as any)?.custody?.address || account.address || null
  const chainId = account.chainId || 8453 // Base mainnet
  
  const connectWallet = useCallback(async () => {
    // In Base App, wallet is automatically connected if user has context
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
  
  // Get user profile information
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
  
  // Get Base App specific capabilities
  const getBaseAppCapabilities = useCallback(() => {
    if (!baseAppProvider) return null
    
    return baseAppProvider.getMiniKitCapabilities()
  }, [baseAppProvider])
  
  // Get network information
  const getNetworkInfo = useCallback(() => {
    return {
      chainId,
      networkName: chainId === 8453 ? 'Base Mainnet' : 
                   chainId === 84532 ? 'Base Sepolia Testnet' : 
                   'Unknown Network',
      isBaseChain: chainId === 8453 || chainId === 84532,
      supportsGasless: true // Base App supports gasless transactions
    }
  }, [chainId])
  
  // Check if gasless transactions are available
  const canUseGaslessTransactions = useCallback(() => {
    return baseAppProvider?.canUseGaslessTransactions() || false
  }, [baseAppProvider])
  
  return {
    // Connection state
    address,
    isConnected,
    chainId,
    balance: null, // Balance not directly available in MiniKit context
    isLoading,
    error,
    
    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage,
    sendTransaction,
    
    // Base App specific info
    userProfile: getUserProfile(),
    miniKitCapabilities: getBaseAppCapabilities(),
    networkInfo: getNetworkInfo(),
    
    // Base App features
    canUseGasless: canUseGaslessTransactions(),
    custodyWallet: {
      address: (miniKit.context?.user as any)?.custody?.address,
      type: 'custody'
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
      clientName: (miniKit.context?.client as any)?.name,
      isBaseApp: baseAppProvider?.isInBaseApp() || false,
      isFarcasterContext: baseAppProvider?.isInFarcasterContext() || false
    },
    
    // Environment info
    environmentInfo: baseAppProvider?.getEnvironmentInfo() || null,
    
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