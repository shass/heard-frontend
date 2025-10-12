'use client'

import { useState, useEffect, useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Context } from '@farcaster/miniapp-sdk'
import { useMiniKitContext } from '../hooks/useMiniKitContext'
import { AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { Platform } from '../../config'

export function useBaseAppAuthStrategy(): IAuthStrategy {
  const miniKitContext = useMiniKitContext()

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkContext, setSdkContext] = useState<Context.MiniAppContext | null>(null)

  // Get SDK context
  useEffect(() => {
    sdk.context.then(setSdkContext).catch(console.error)
  }, [])

  // Stable reference to user FID for dependency tracking
  const userFid = sdkContext?.user?.fid

  // Update user when context changes
  useEffect(() => {
    if (sdkContext?.user) {
      const contextUser = sdkContext.user
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
          isFromContext: true
        }
      })
    } else {
      setUser(null)
    }
  }, [sdkContext, userFid])

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

        return { success: true, user: authenticatedUser }
      } else {
        console.error('[useBaseAppAuthStrategy] ❌ No result from signIn')
        setError('Authentication failed')
        setAuthState(AuthState.ERROR)
        setIsLoading(false)
        return { success: false, error: 'Authentication failed' }
      }
    } catch (err: any) {
      console.error('[useBaseAppAuthStrategy] ❌ Exception during authentication:', err)

      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      setAuthState(AuthState.ERROR)
      setIsLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [sdkContext])

  const logout = useCallback(async () => {
    try {
      setError(null)
      setUser(null)
      setAuthState(AuthState.UNAUTHENTICATED)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }, [])

  const checkAuthStatus = useCallback(async () => {
    if (!sdkContext) return

    try {
      if (sdkContext.user) {
        setAuthState(AuthState.AUTHENTICATED)
      } else {
        setAuthState(AuthState.UNAUTHENTICATED)
      }
    } catch (err) {
      setAuthState(AuthState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    }
  }, [sdkContext])

  // Check auth status on mount and when context changes
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
    canAuthenticate: !!sdkContext,
  }
}
