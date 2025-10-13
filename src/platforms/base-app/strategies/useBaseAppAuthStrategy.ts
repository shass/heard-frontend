'use client'

import { useState, useEffect, useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Context } from '@farcaster/miniapp-sdk'
import { AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { Platform } from '../../config'
import { useAuthStore } from '@/lib/store'

export function useBaseAppAuthStrategy(): IAuthStrategy {
  console.log('[useBaseAppAuthStrategy] 🔄 Hook called/re-rendered')

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkContext, setSdkContext] = useState<Context.MiniAppContext | null>(null)

  // Get SDK context (only once on mount)
  useEffect(() => {
    console.log('[useBaseAppAuthStrategy] useEffect[1] for SDK context triggered')
    let mounted = true

    sdk.context
      .then((ctx) => {
        if (!mounted) return
        console.log('[useBaseAppAuthStrategy] SDK context loaded:', ctx)
        setSdkContext(ctx)
      })
      .catch((error) => {
        if (!mounted) return
        console.error('[useBaseAppAuthStrategy] Failed to get SDK context:', error)
      })

    return () => {
      console.log('[useBaseAppAuthStrategy] useEffect[1] cleanup called')
      mounted = false
    }
  }, [])

  // Update user when context changes (only once when sdkContext loads)
  useEffect(() => {
    console.log('[useBaseAppAuthStrategy] useEffect[2] for user update triggered, sdkContext:', !!sdkContext)
    if (sdkContext?.user) {
      const contextUser = sdkContext.user
      console.log('[useBaseAppAuthStrategy] Setting user from context')
      const newUser: User = {
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
          isFromContext: true
        }
      }
      setUser(newUser)

      // Sync with Zustand store (without subscribing to avoid re-renders)
      console.log('[useBaseAppAuthStrategy] Syncing user to Zustand store')
      useAuthStore.getState().setUser(newUser as any)
    } else {
      console.log('[useBaseAppAuthStrategy] Setting user to null')
      setUser(null)
      useAuthStore.getState().setUser(null)
    }
    // Only run when sdkContext changes, not when user.fid changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkContext])

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    console.log('[useBaseAppAuthStrategy] 🚀 Authenticate called')

    if (!sdkContext) {
      console.error('[useBaseAppAuthStrategy] ❌ SDK context not available')
      setError('Base App platform not initialized')
      return { success: false, error: 'Base App platform not initialized' }
    }

    try {
      console.log('[useBaseAppAuthStrategy] 🔄 Calling sdk.actions.signIn()')
      setError(null)
      setIsLoading(true)
      setAuthState(AuthState.LOADING)
      useAuthStore.getState().setLoading(true)

      const result = await sdk.actions.signIn({
        nonce: crypto.randomUUID()
      })

      console.log('[useBaseAppAuthStrategy] 📥 SignIn result:', result)

      if (result) {
        console.log('[useBaseAppAuthStrategy] ✅ Authentication successful')

        const authenticatedUser: User = {
          id: (result as any).fid?.toString() || sdkContext.user?.fid?.toString() || 'unknown',
          walletAddress: (result as any).address || (sdkContext.user as any)?.custody?.address,
          platform: Platform.BASE_APP,
          metadata: {
            ...result,
            fid: (result as any).fid,
            username: (result as any).username,
            displayName: (result as any).displayName,
            pfpUrl: (result as any).pfpUrl,
            isAuthenticated: true
          }
        }

        setUser(authenticatedUser)
        setAuthState(AuthState.AUTHENTICATED)
        setIsLoading(false)
        useAuthStore.getState().setUser(authenticatedUser as any)
        useAuthStore.getState().setLoading(false)

        return { success: true, user: authenticatedUser }
      } else {
        console.error('[useBaseAppAuthStrategy] ❌ No result from signIn')
        setError('Authentication failed')
        setAuthState(AuthState.ERROR)
        setIsLoading(false)
        useAuthStore.getState().setLoading(false)
        return { success: false, error: 'Authentication failed' }
      }
    } catch (err: any) {
      console.error('[useBaseAppAuthStrategy] ❌ Exception during authentication:', err)

      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      setAuthState(AuthState.ERROR)
      setIsLoading(false)
      useAuthStore.getState().setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [sdkContext])

  const logout = useCallback(async () => {
    try {
      setError(null)
      setUser(null)
      setAuthState(AuthState.UNAUTHENTICATED)
      useAuthStore.getState().logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }, [])

  // Check auth status when sdkContext changes (only once when loaded)
  useEffect(() => {
    console.log('[useBaseAppAuthStrategy] useEffect[3] for auth status check triggered, sdkContext:', !!sdkContext)

    if (!sdkContext) {
      console.log('[useBaseAppAuthStrategy] No sdkContext yet, skipping auth check')
      return
    }

    try {
      if (sdkContext.user) {
        console.log('[useBaseAppAuthStrategy] Setting authState to AUTHENTICATED')
        setAuthState(AuthState.AUTHENTICATED)
      } else {
        console.log('[useBaseAppAuthStrategy] Setting authState to UNAUTHENTICATED')
        setAuthState(AuthState.UNAUTHENTICATED)
      }
    } catch (err) {
      console.error('[useBaseAppAuthStrategy] Error in auth status check:', err)
      setAuthState(AuthState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    }
  }, [sdkContext])

  const checkAuthStatus = useCallback(async () => {
    console.log('[useBaseAppAuthStrategy] checkAuthStatus called manually')
    // This is only for manual checks, not automatic ones
    // Re-fetch context to get latest state
    try {
      const ctx = await sdk.context
      if (ctx.user) {
        setAuthState(AuthState.AUTHENTICATED)
      } else {
        setAuthState(AuthState.UNAUTHENTICATED)
      }
    } catch (err) {
      setAuthState(AuthState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    }
  }, [])

  const result = {
    user,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING || isLoading,
    error,
    authenticate,
    logout,
    checkAuthStatus,
    canAuthenticate: !!sdkContext,
  }

  console.log('[useBaseAppAuthStrategy] 📦 Returning strategy object:', {
    hasUser: !!user,
    authState,
    isAuthenticated: result.isAuthenticated,
    isLoading: result.isLoading
  })

  return result
}
