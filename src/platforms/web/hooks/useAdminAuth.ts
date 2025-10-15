'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store'

export function useAdminAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { setUser, setLoading, logout: storeLogout, user, isAuthenticated, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  // Check auth on mount
  useEffect(() => {
    const checkInitialAuth = async () => {
      setLoading(true)
      try {
        const userData = await authApi.checkAuth()
        if (userData) {
          setUser(userData)
        } else {
          storeLogout()
        }
      } catch (error: any) {
        storeLogout()
      } finally {
        setLoading(false)
      }
    }

    checkInitialAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async () => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // Get nonce from backend using direct fetch
      const nonceResponse = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
        credentials: 'include',
      })

      if (!nonceResponse.ok) {
        throw new Error(`Nonce request failed: ${nonceResponse.status}`)
      }

      const nonceData = await nonceResponse.json()

      // Extract message and jwtToken from the response
      const message = nonceData.data.message
      const jwtToken = nonceData.data.jwtToken

      // Sign message with wallet
      const signature = await signMessageAsync({ message })

      // Connect wallet and get user data using direct fetch
      const connectResponse = await fetch('/api/auth/connect-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message,
          jwtToken
        }),
        credentials: 'include',
      })

      if (!connectResponse.ok) {
        throw new Error(`Connect wallet failed: ${connectResponse.status}`)
      }

      const connectData = await connectResponse.json()

      setUser(connectData.data.user)
      return connectData.data.user
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed'
      setError(errorMessage)
      console.error('[useAdminAuth] Login failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.disconnect()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      storeLogout()
    }
  }

  const checkAuth = async () => {
    setLoading(true)
    try {
      const userData = await authApi.checkAuth()
      if (userData) {
        setUser(userData)
      } else {
        storeLogout()
      }
    } catch (error: any) {
      storeLogout()
    } finally {
      setLoading(false)
    }
  }

  return {
    login,
    logout,
    checkAuth,
    isAuthenticated,
    user,
    isLoading,
    error,
    address,
    isConnected
  }
}
