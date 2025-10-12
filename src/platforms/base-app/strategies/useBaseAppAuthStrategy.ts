'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMiniKit, useAuthenticate } from '@coinbase/onchainkit/minikit'
import { BaseAppAuthProvider } from '../providers/BaseAppAuthProvider'
import { AuthState, User } from '../../_core/shared/interfaces/IAuthProvider'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { Platform } from '../../config'

export function useBaseAppAuthStrategy(): IAuthStrategy {
  const miniKit = useMiniKit()
  const authenticateHook = useAuthenticate()

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create auth provider instance directly
  const authProvider = useMemo(() => {
    return new BaseAppAuthProvider(miniKit, authenticateHook)
  }, [miniKit, authenticateHook])

  // Set up auth state listener
  useEffect(() => {
    if (!authProvider) return

    const unsubscribe = authProvider.onAuthStateChange((state) => {
      setAuthState(state)
      setIsLoading(state === AuthState.LOADING)
    })

    return unsubscribe
  }, [authProvider])

  // Stable reference to user FID for dependency tracking
  const userFid = miniKit.context?.user?.fid

  // Update user when authenticated or when context changes
  useEffect(() => {
    if (authState === AuthState.AUTHENTICATED && authProvider) {
      authProvider.getCurrentUser().then(setUser).catch(console.error)
    } else if (miniKit.context?.user) {
      // Set user from context even if not authenticated (less secure)
      const contextUser = miniKit.context.user
      setUser({
        id: contextUser.fid?.toString() || 'unknown',
        walletAddress: (contextUser as any).custody?.address,
        platform: Platform.BASE_APP,
        metadata: {
          fid: contextUser.fid,
          username: contextUser.username,
          displayName: contextUser.displayName,
          pfpUrl: contextUser.pfpUrl,
          custody: (contextUser as any).custody,
          verifications: (contextUser as any).verifications,
          isFromContext: true // Mark as context-only user
        }
      })
    } else {
      setUser(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, authProvider, userFid])

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    console.log('[useBaseAppAuthStrategy] 🚀 Authenticate called')

    if (!authProvider) {
      console.error('[useBaseAppAuthStrategy] ❌ Auth provider not available')
      setError('Base App platform not initialized')
      return { success: false, error: 'Base App platform not initialized' }
    }

    try {
      console.log('[useBaseAppAuthStrategy] 🔄 Calling authProvider.connect()')
      setError(null)
      const result = await authProvider.connect()

      console.log('[useBaseAppAuthStrategy] 📥 Connect result:', result)

      if (result.success) {
        console.log('[useBaseAppAuthStrategy] ✅ Authentication successful')
        setUser(result.user || null)
        return { success: true, user: result.user }
      } else {
        console.error('[useBaseAppAuthStrategy] ❌ Authentication failed:', result.error)
        setError(result.error || 'Authentication failed')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      console.error('[useBaseAppAuthStrategy] ❌ Exception during authentication:', err)

      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [authProvider])

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

  // Check auth status on mount and when context changes
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus, miniKit.context])

  return {
    user,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING || isLoading,
    error,
    authenticate,
    logout,
    checkAuthStatus,
    canAuthenticate: !!authProvider && !!miniKit.context,
  }
}
