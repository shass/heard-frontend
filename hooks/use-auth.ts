// Authentication hook with Web3 wallet integration

'use client'

import { useEffect, useCallback } from 'react'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import type { User } from '@/lib/types'

export interface UseAuth {
  // State
  user: User | null
  isAuthenticated: boolean
  isConnected: boolean
  loading: boolean
  error: string | null
  
  // Actions
  login: () => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export function useAuth(): UseAuth {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()
  
  const {
    user,
    isAuthenticated,
    loading,
    error,
    setUser,
    setLoading,
    setError,
    logout: storeLogout,
  } = useAuthStore()

  /**
   * Check authentication status on app load
   */
  const checkAuth = useCallback(async () => {
    if (!isConnected || !address) {
      storeLogout()
      return
    }

    setLoading(true)
    try {
      const user = await authApi.checkAuth()
      if (user && user.walletAddress.toLowerCase() === address.toLowerCase()) {
        setUser(user)
      } else {
        storeLogout()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      storeLogout()
    } finally {
      setLoading(false)
    }
  }, [isConnected, address, setUser, setLoading, storeLogout])

  /**
   * Login with wallet signature
   */
  const login = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Get nonce from backend
      const { nonce, message } = await authApi.getNonce(address)

      // Step 2: Sign message with wallet
      const signature = await signMessageAsync({ 
        message,
      })

      // Step 3: Send signature to backend for verification
      const { user, token } = await authApi.connectWallet({
        walletAddress: address,
        signature,
        message,
      })

      // Step 4: Update store with user data
      setUser(user)
      
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.message || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }, [isConnected, address, signMessageAsync, setUser, setLoading, setError])

  /**
   * Logout and disconnect wallet
   */
  const logout = useCallback(async () => {
    setLoading(true)
    
    try {
      // Notify backend about logout
      if (isAuthenticated) {
        await authApi.disconnect()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }

    // Clear local state
    storeLogout()
    
    // Disconnect wallet
    disconnect()
    
    setLoading(false)
  }, [isAuthenticated, storeLogout, disconnect, setLoading])

  /**
   * Auto-check auth when wallet connection changes
   */
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      checkAuth()
    } else if (!isConnected && isAuthenticated) {
      storeLogout()
    }
  }, [isConnected, address, isAuthenticated, checkAuth, storeLogout])

  /**
   * Auto-logout if wallet address changes
   */
  useEffect(() => {
    if (isAuthenticated && user && address && 
        user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      console.log('Wallet address changed, logging out')
      storeLogout()
    }
  }, [address, user, isAuthenticated, storeLogout])

  return {
    // State
    user,
    isAuthenticated,
    isConnected,
    loading,
    error,
    
    // Actions
    login,
    logout,
    checkAuth,
  }
}