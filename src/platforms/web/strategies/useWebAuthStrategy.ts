'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { WebAuthProvider, AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { useAuthStore } from '@/lib/store'
import { Platform } from '@/src/platforms/config'

export function useWebAuthStrategy(): IAuthStrategy {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  // Read user from store instead of local state to avoid conflicts
  const user = useAuthStore(state => state.user)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync authState with user from store
  // This ensures that when WebAuthInitializer restores user, authState reflects it
  useEffect(() => {
    if (user) {
      console.log('[useWebAuthStrategy] User exists in store, setting authState to AUTHENTICATED')
      setAuthState(AuthState.AUTHENTICATED)
    } else {
      console.log('[useWebAuthStrategy] No user in store, setting authState to UNAUTHENTICATED')
      setAuthState(AuthState.UNAUTHENTICATED)
    }
  }, [user])

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
      // Don't override authState if we already have a user from WebAuthInitializer
      const currentUser = useAuthStore.getState().user
      if (currentUser && state === AuthState.UNAUTHENTICATED) {
        console.log('[useWebAuthStrategy] Ignoring UNAUTHENTICATED state - user exists in store')
        return
      }

      setAuthState(state)
      const loading = state === AuthState.LOADING
      setIsLoading(loading)
      // Sync loading state with Zustand store
      useAuthStore.getState().setLoading(loading)
    })

    return unsubscribe
  }, [authProvider])

  // NOTE: User syncing with store is handled by:
  // 1. WebAuthInitializer on app mount (restores session)
  // 2. authenticate() method when user manually logs in
  // 3. authState syncs with user via useEffect above
  // No need to call getCurrentUser() when authState changes

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
        // Sync with Zustand store
        useAuthStore.getState().setUser(result.user as any || null)
        return { success: true, user: result.user }
      } else {
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
      setAuthState(currentUser ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED)
      // Sync with Zustand store
      useAuthStore.getState().setUser(currentUser as any)
    } catch (err) {
      setAuthState(AuthState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    }
  }, [authProvider])

  // Check auth status on mount - ONLY if not already initialized globally
  // WebAuthInitializer handles the initial auth check to prevent duplicate requests
  useEffect(() => {
    const { initialized } = useAuthStore.getState()

    // Skip if already initialized by WebAuthInitializer
    if (initialized) {
      console.log('[useWebAuthStrategy] Skipping auth check - already initialized globally')
      return
    }

    // Only check if we have an auth provider ready
    if (!authProvider) return

    console.log('[useWebAuthStrategy] Running auth check (not initialized globally)')
    checkAuthStatus()
  }, [checkAuthStatus, authProvider])

  return {
    user: user ? { ...user, platform: Platform.WEB } : null,
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
