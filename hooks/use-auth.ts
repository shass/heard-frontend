'use client'

import { useAccount, useSignMessage } from 'wagmi'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { usePlatformDetection } from '@/hooks/use-platform-detection'
import { useCallback } from 'react'

export function useAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { setUser, setLoading, setError, isAuthenticated, user } = useAuthStore()
  const platform = usePlatformDetection()

  const login = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Get nonce from backend
      console.log('🔐 Getting nonce for address:', address)
      const { message } = await authApi.getNonce(address)

      // Step 2: Sign message - optimized for mobile
      console.log('✍️ Requesting signature...')
      const signature = await signMessageAsync({
        message,
        // On mobile, the promise resolves immediately after user interaction
        // Deep linking will handle the rest automatically
      })

      // Step 3: Verify signature with backend
      console.log('🔐 Verifying signature...')
      const { user: userData } = await authApi.connectWallet({
        walletAddress: address,
        signature,
        message,
      })

      // Step 4: Update store
      setUser(userData)
      console.log('✅ Authentication successful')

    } catch (error: any) {
      console.error('❌ Authentication failed:', error)
      setError(error.message || 'Authentication failed')
      throw error
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, signMessageAsync, setUser, setLoading, setError])

  const logout = useCallback(async () => {
    try {
      await authApi.disconnect()
    } catch (error) {
      console.warn('Logout API call failed:', error)
    }

    // Clear store regardless of API result
    setUser(null)
    setError(null)
  }, [setUser, setError])

  return {
    login,
    logout,
    isAuthenticated,
    user,
    isLoading: useAuthStore(state => state.loading),
    error: useAuthStore(state => state.error),
    platform,
  }
}
