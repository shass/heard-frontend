'use client'

import { useAccount, useSignMessage } from 'wagmi'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { usePlatformDetection } from '@/hooks/use-platform-detection'
import { useMiniKitEnvironment } from '@/hooks/use-minikit-environment'
import { useCallback } from 'react'

export function useAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { setUser, setLoading, setError, isAuthenticated, user } = useAuthStore()
  const platform = usePlatformDetection()
  const { shouldUseMiniKitAuth, canUseAuthenticate } = useMiniKitEnvironment()

  const login = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Get nonce from backend
      const { message, jwtToken } = await authApi.getNonce(address)

      // Step 2: Sign message with wagmi
      const signature = await signMessageAsync({
        message,
      })

      // Step 3: Verify signature with backend using JWT token
      const { user: userData } = await authApi.connectWallet({
        walletAddress: address,
        signature,
        message,
        jwtToken,
      })

      // Step 4: Update store
      setUser(userData)

    } catch (error: any) {
      setError(error.message || 'Authentication failed')
      throw error
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, signMessageAsync, shouldUseMiniKitAuth, setUser, setLoading, setError])

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
    shouldUseMiniKitAuth,
    canUseAuthenticate,
  }
}
