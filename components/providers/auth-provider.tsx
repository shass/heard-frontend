'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { useAuthCleanup } from '@/hooks/use-auth-cleanup'

// Создаем контекст для auth actions
interface AuthContextType {
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthActions() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthActions must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected } = useAccount()
  const config = useConfig() // Get the current wagmi config
  const { 
    user, 
    isAuthenticated, 
    loading,
    setUser, 
    setLoading, 
    setError, 
    logout: storeLogout 
  } = useAuthStore()

  // Enable global authentication cleanup
  useAuthCleanup()

  /**
   * Check authentication status
   */
  const checkAuth = async () => {
    if (!isConnected || !address) {
      if (isAuthenticated) {
        console.log('Wallet disconnected, logging out')
        storeLogout()
      }
      return
    }

    // Skip if already authenticated with same address
    if (isAuthenticated && user && user.walletAddress.toLowerCase() === address.toLowerCase()) {
      console.log('Already authenticated with same address, skipping check')
      return
    }

    console.log('Checking auth status for:', address)
    setLoading(true)
    try {
      const userData = await authApi.checkAuth()
      if (userData && userData.walletAddress.toLowerCase() === address.toLowerCase()) {
        console.log('Auth check successful, user found:', userData.walletAddress)
        setUser(userData)
      } else {
        console.log('Auth check failed: user not found or address mismatch', { userData, address })
        if (userData) {
          console.log('Address mismatch - expected:', address, 'got:', userData.walletAddress)
        }
        storeLogout()
      }
    } catch (error: any) {
      // 401 errors are expected when not authenticated - don't spam console
      if (error.status !== 401) {
        console.error('Auth check failed:', error)
      } else {
        console.log('Not authenticated (401) - this is normal')
      }
      storeLogout()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login with wallet signature
   */
  const login = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // Import signMessage dynamically to avoid SSR issues
      const { signMessage } = await import('wagmi/actions')
      
      // Step 1: Get nonce from backend
      console.log('Step 1: Getting nonce for address:', address)
      const { nonce, message } = await authApi.getNonce(address)
      console.log('Step 1 complete: Got nonce', nonce)

      // Step 2: Sign message with wallet
      console.log('Step 2: Signing message with wallet')
      const signature = await signMessage(config, { message })
      console.log('Step 2 complete: Got signature', signature)

      // Step 3: Send signature to backend for verification
      console.log('Step 3: Sending signature to backend for verification')
      const { user: userData } = await authApi.connectWallet({
        walletAddress: address,
        signature,
        message,
      })
      console.log('Step 3 complete: Got user data', userData)

      // Step 4: Update store with user data
      console.log('Step 4: Updating store with user data')
      setUser(userData)
      console.log('Login successful! Token stored as HttpOnly cookie by backend.')
      
    } catch (error: any) {
      console.error('Login failed at step:', error)
      setError(error.message || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout and disconnect wallet
   */
  const logout = async () => {
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
    try {
      const { disconnect } = await import('wagmi/actions')
      disconnect(config)
    } catch (error) {
      console.error('Wallet disconnect error:', error)
    }
    
    setLoading(false)
  }

  /**
   * Auto-check auth on app load (if cookie exists)
   */
  useEffect(() => {
    // Only check once on mount, regardless of wallet connection
    // This will use the HttpOnly cookie if available
    const checkInitialAuth = async () => {
      console.log('🚀 Running initial auth check on app load')
      setLoading(true)
      try {
        const userData = await authApi.checkAuth()
        if (userData) {
          console.log('✅ Initial auth check successful:', userData.walletAddress)
          setUser(userData)
        } else {
          console.log('❌ No user data returned from checkAuth')
        }
      } catch (error: any) {
        // No valid session - this is normal
        console.log('🔍 No existing session found:', error?.status || error?.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    checkInitialAuth()
  }, []) // Run only once on mount

  /**
   * Auto-check auth when wallet connection changes
   */
  useEffect(() => {
    if (isConnected && address) {
      checkAuth()
    } else if (!isConnected && isAuthenticated) {
      storeLogout()
    }
  }, [isConnected, address])

  /**
   * Auto-logout if wallet address changes
   */
  useEffect(() => {
    if (isAuthenticated && user && address && 
        user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      console.log('Wallet address changed, logging out')
      storeLogout()
    }
  }, [address, user, isAuthenticated])

  const contextValue: AuthContextType = {
    login,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}