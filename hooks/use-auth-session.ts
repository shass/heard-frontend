'use client'

import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'

export function useAuthSession() {
  const {
    user,
    isAuthenticated,
    setUser,
    setLoading,
    logout: storeLogout
  } = useAuthStore()

  /**
   * Check authentication status
   */
  const checkAuth = async (isConnected: boolean, address: string | undefined) => {
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
   * Check auth on app load using HttpOnly cookie
   * Now validates against persisted state for better mobile experience
   */
  const checkInitialAuth = async () => {
    console.log('🚀 Running initial auth check on app load')
    setLoading(true)
    try {
      const userData = await authApi.checkAuth()
      if (userData) {
        console.log('✅ Initial auth check successful:', userData.walletAddress)

        // Validate against persisted state to ensure consistency
        if (user && user.walletAddress && user.walletAddress.toLowerCase() === userData.walletAddress.toLowerCase()) {
          console.log('📱 Persisted state matches server session - user already authenticated')
        } else {
          console.log('🔄 Updating user state with server session data')
          setUser(userData)
        }
      } else {
        console.log('❌ No valid session found on server')
        // Clear persisted state if server has no session
        if (user) {
          console.log('🧹 Clearing stale persisted auth state')
          storeLogout()
        }
      }
    } catch (error: any) {
      // No valid session - clear stale persisted state if exists
      if (error?.status === 401 && user) {
        console.log('🧹 Server session expired, clearing persisted state')
        storeLogout()
      } else {
        console.log('🔍 No existing session found:', error?.status || error?.message || 'Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    checkAuth,
    checkInitialAuth
  }
}
