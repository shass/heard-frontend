'use client'

import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store'

export function useAdminAuth() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { setUser, setLoading, logout: storeLogout, user, isAuthenticated, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const login = async () => {
    console.log('[useAdminAuth] login called, isConnected:', isConnected, 'address:', address)
    
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Get nonce from backend using direct fetch
      console.log('[useAdminAuth] Requesting nonce for address:', address)
      const nonceResponse = await fetch('http://localhost:3001/api/auth/nonce', {
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
      console.log('[useAdminAuth] Received nonce data:', nonceData)
      
      // Extract message and jwtToken from the response
      const message = nonceData.data.message
      const jwtToken = nonceData.data.jwtToken
      console.log('[useAdminAuth] Message to sign:', message)
      console.log('[useAdminAuth] JWT Token:', jwtToken)
      
      // Sign message with wallet
      console.log('[useAdminAuth] Requesting signature...')
      const signature = await signMessageAsync({ message })
      console.log('[useAdminAuth] Signature received:', signature)
      
      // Connect wallet and get user data using direct fetch
      console.log('[useAdminAuth] Connecting wallet...')
      const connectResponse = await fetch('http://localhost:3001/api/auth/connect-wallet', {
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
      console.log('[useAdminAuth] Connected successfully, data:', connectData)
      
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