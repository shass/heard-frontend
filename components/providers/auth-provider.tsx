'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { useAuthCleanup } from '@/hooks/use-auth-cleanup'
import { useCacheWarmer } from '@/hooks/use-cache-warmer'

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
  
  // Cache warming functionality
  const { warmAuthenticated, clearAuthCache } = useCacheWarmer()

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
    if (isAuthenticated && user && user.walletAddress && user.walletAddress.toLowerCase() === address.toLowerCase()) {
      console.log('Already authenticated with same address, skipping check')
      return
    }
    
    // Also skip if we just loaded user data and addresses match
    if (user && user.walletAddress && user.walletAddress.toLowerCase() === address.toLowerCase()) {
      console.log('User already loaded with matching address, skipping check')
      return
    }

    console.log('Checking auth status for:', address)
    setLoading(true)
    try {
      const userData = await authApi.checkAuth()
      if (userData) {
        if (userData.walletAddress && userData.walletAddress.toLowerCase() === address.toLowerCase()) {
          // Perfect match - user authenticated with current wallet address
          console.log('Auth check successful, user authenticated with current address:', userData.walletAddress)
          setUser(userData)
          
          // Warm cache for authenticated user
          warmAuthenticated().catch(error => 
            console.warn('Failed to warm cache for authenticated user:', error)
          )
        } else {
          // User has valid session but with different wallet address
          console.log('Valid session found but for different address. Current:', address, 'Session:', userData.walletAddress)
          console.log('User needs to re-authenticate with current wallet')
          
          // Don't set user data, but don't logout either - let user re-authenticate
          // The UI will show "Connect Wallet" button since user state will be null
        }
      } else {
        console.log('No valid session found')
        // No valid session - user will see "Connect Wallet" button
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
      
      // Step 5: Warm cache for new authenticated user
      console.log('Step 5: Warming cache for authenticated user')
      warmAuthenticated().catch(error => 
        console.warn('Failed to warm cache after login:', error)
      )
      
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
    
    // Clear auth-specific cache
    clearAuthCache()
    
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
          console.log('Note: User will need to re-authenticate if wallet address differs from session')
          setUser(userData)
          
          // Warm cache for existing authenticated session
          warmAuthenticated().catch(error => 
            console.warn('Failed to warm cache on app load:', error)
          )
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
    console.log('🔄 Wallet connection changed:', { isConnected, address, isAuthenticated })
    
    if (isConnected && address) {
      console.log('🔄 Wallet connected, running checkAuth for:', address)
      checkAuth()
    } else if (!isConnected && isAuthenticated) {
      console.log('🔄 Wallet disconnected but user authenticated, logging out')
      storeLogout()
    } else {
      console.log('🔄 No action needed')
    }
  }, [isConnected, address])

  /**
   * Handle wallet address changes
   */
  useEffect(() => {
    if (isAuthenticated && user && user.walletAddress && address && 
        user.walletAddress.toLowerCase() !== address.toLowerCase()) {
      console.log('Wallet address changed - user needs to re-authenticate')
      console.log('Previous:', user.walletAddress, 'Current:', address)
      
      // Clear user state but don't call logout API since session might be valid for original address
      setUser(null)
      // The UI will show "Connect Wallet" button for the new address
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