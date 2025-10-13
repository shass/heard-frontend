'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { WebAuthProvider, AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { useAuthStore } from '@/lib/store'

export function useWebAuthStrategy(): IAuthStrategy {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create auth provider instance directly
  const authProvider = useMemo(() => {
    if (!address) return null
    return new WebAuthProvider(
      { address, isConnected },
      async (message: string) => signMessageAsync({ message })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected])

  // Set up auth state listener
  useEffect(() => {
    if (!authProvider) return

    const unsubscribe = authProvider.onAuthStateChange((state) => {
      setAuthState(state)
      const loading = state === AuthState.LOADING
      setIsLoading(loading)
      // Sync loading state with Zustand store
      useAuthStore.getState().setLoading(loading)
    })

    return unsubscribe
  }, [authProvider])

  // Update user when authenticated
  useEffect(() => {
    if (authState === AuthState.AUTHENTICATED && authProvider) {
      authProvider.getCurrentUser().then((user) => {
        setUser(user)
        // Sync with Zustand store
        useAuthStore.getState().setUser(user as any)
      }).catch(console.error)
    } else {
      setUser(null)
      // Sync with Zustand store
      useAuthStore.getState().setUser(null)
    }
  }, [authState, authProvider])

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (!authProvider) {
      const error = 'Web platform not initialized'
      setError(error)
      return { success: false, error }
    }

    if (!isConnected || !address) {
      const error = 'Wallet not connected'
      setError(error)
      return { success: false, error }
    }

    try {
      setError(null)
      const result = await authProvider.connect()

      if (result.success) {
        console.log('[WebAuthStrategy] Authentication successful, user:', result.user)
        setUser(result.user || null)
        // Sync with Zustand store
        useAuthStore.getState().setUser(result.user as any || null)
        console.log('[WebAuthStrategy] User set in store:', useAuthStore.getState().user)
        return { success: true, user: result.user }
      } else {
        console.error('[WebAuthStrategy] Authentication failed:', result.error)
        setError(result.error || 'Authentication failed')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[WebAuthStrategy] Authentication error:', err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [authProvider, isConnected, address])

  const logout = useCallback(async () => {
    if (!authProvider) return

    try {
      setError(null)
      await authProvider.disconnect()
      setUser(null)
      // Sync with Zustand store
      useAuthStore.getState().logout()
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
      // Sync with Zustand store
      useAuthStore.getState().setUser(currentUser as any)
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
    canAuthenticate: isConnected && !!address && !!authProvider,
  }
}
