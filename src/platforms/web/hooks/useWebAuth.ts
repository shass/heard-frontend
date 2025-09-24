'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { usePlatform } from '../../PlatformContext'
import { WebPlatformProvider } from '../WebPlatformProvider'
import { AuthState, User } from '../../shared/interfaces/IAuthProvider'

export function useWebAuth() {
  const { provider } = usePlatform()
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get Web platform provider
  const webProvider = provider instanceof WebPlatformProvider ? provider : null
  const authProvider = webProvider?.getAuthProvider()
  
  // Set up auth state listener
  useEffect(() => {
    if (!authProvider) return
    
    const unsubscribe = authProvider.onAuthStateChange((state) => {
      setAuthState(state)
      setIsLoading(state === AuthState.LOADING)
    })
    
    return unsubscribe
  }, [authProvider])
  
  // Update user when authenticated
  useEffect(() => {
    if (authState === AuthState.AUTHENTICATED && authProvider) {
      authProvider.getCurrentUser().then(setUser).catch(console.error)
    } else {
      setUser(null)
    }
  }, [authState, authProvider])
  
  const authenticate = useCallback(async () => {
    if (!authProvider) {
      setError('Web platform not initialized')
      return
    }
    
    if (!isConnected || !address) {
      setError('Wallet not connected')
      return
    }
    
    try {
      setError(null)
      const result = await authProvider.connect()
      
      if (result.success) {
        setUser(result.user || null)
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    }
  }, [authProvider, isConnected, address])
  
  const logout = useCallback(async () => {
    if (!authProvider) return
    
    try {
      setError(null)
      await authProvider.disconnect()
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }, [authProvider])
  
  const checkAuthStatus = useCallback(async () => {
    if (!authProvider) return
    
    try {
      const currentUser = await authProvider.getCurrentUser()
      setUser(currentUser)
      setAuthState(currentUser ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED)
    } catch (err) {
      setAuthState(AuthState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    }
  }, [authProvider])
  
  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])
  
  return {
    user,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING || isLoading,
    error,
    authenticate,
    logout,
    checkAuthStatus,
    
    // Web-specific properties
    walletAddress: address,
    isWalletConnected: isConnected,
    canAuthenticate: isConnected && !!address && !!authProvider,
  }
}