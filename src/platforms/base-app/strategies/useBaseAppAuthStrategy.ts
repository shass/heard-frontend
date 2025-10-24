'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { Context } from '@farcaster/miniapp-sdk'
import { AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { Platform } from '../../config'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'

export function useBaseAppAuthStrategy(): IAuthStrategy {
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkContext, setSdkContext] = useState<Context.MiniAppContext | null>(null)
  const hasCheckedToken = useRef(false)

  // Get SDK context (only once on mount)
  useEffect(() => {
    console.log('[useBaseAppAuthStrategy] useEffect[1] for SDK context triggered')
    let mounted = true

    // Set loading to false initially since we're checking context
    useAuthStore.getState().setLoading(false)

    sdk.context
      .then((ctx) => {
        if (!mounted) return
        console.log('[useBaseAppAuthStrategy] SDK context loaded:', ctx)
        setSdkContext(ctx)
      })
      .catch((error) => {
        if (!mounted) return
        console.error('[useBaseAppAuthStrategy] Failed to get SDK context:', error)
        useAuthStore.getState().setLoading(false)
      })

    return () => {
      console.log('[useBaseAppAuthStrategy] useEffect[1] cleanup called')
      mounted = false
    }
  }, [])

  // Get wallet address and set context user info
  useEffect(() => {
    if (sdkContext?.user) {
      const contextUser = sdkContext.user

      // Try to get wallet address from Ethereum provider
      const getWalletAddress = async () => {
        try {
          const provider = sdk.wallet.ethProvider
          if (provider) {
            const accounts = await provider.request({ method: 'eth_accounts' })
            return accounts[0]
          }
        } catch (error) {
          console.error('[useBaseAppAuthStrategy] Failed to get wallet address:', error)
        }
        return undefined
      }

      getWalletAddress().then(walletAddress => {
        const newUser: User = {
          id: contextUser.fid?.toString() || 'unknown',
          walletAddress: walletAddress,
          platform: Platform.BASE_APP,
          metadata: {
            fid: contextUser.fid,
            username: contextUser.username,
            displayName: contextUser.displayName,
            pfpUrl: contextUser.pfpUrl,
            isFromContext: true
          }
        }
        setUser(newUser)
        useAuthStore.getState().setUser(newUser as any)
      })
    } else {
      setUser(null)
      useAuthStore.getState().setUser(null)
    }
  }, [sdkContext])

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (!sdkContext) {
      setError('Base App platform not initialized')
      return { success: false, error: 'Base App platform not initialized' }
    }

    try {
      setError(null)
      setIsLoading(true)
      setAuthState(AuthState.LOADING)
      useAuthStore.getState().setLoading(true)

      // Clear old token before authentication
      console.log('[BaseAppAuthStrategy] Clearing old token before authentication...')
      const { apiClient } = await import('@/lib/api/client')
      apiClient.clearAuthToken()

      // Step 1: Get FID from SDK context
      const fid = sdkContext.user?.fid
      if (!fid) {
        throw new Error('No Farcaster ID found in context')
      }

      // Step 2: Use Quick Auth to get JWT token
      console.log('[BaseAppAuthStrategy] Authenticating with Quick Auth for FID:', fid)
      const { token: quickAuthToken } = await sdk.quickAuth.getToken()

      if (!quickAuthToken) {
        throw new Error('Failed to get Quick Auth token')
      }

      console.log('[BaseAppAuthStrategy] ✅ Quick Auth token obtained')

      // Step 3: Send Quick Auth token to backend for verification
      const { user: userData, token } = await authApi.connectWallet({
        platform: 'base',
        quickAuthToken,
        metadata: {
          fid,
          username: sdkContext.user?.username,
          displayName: sdkContext.user?.displayName,
          pfpUrl: sdkContext.user?.pfpUrl,
          authMethod: 'quick_auth',
        }
      })

      console.log('[BaseAppAuthStrategy] Backend authentication successful:', userData)

      // Step 4: Store token
      if (token) {
        console.log('[BaseAppAuthStrategy] ✅ Got token from backend')
        apiClient.setAuthToken(token)
        console.log('[BaseAppAuthStrategy] Token stored in apiClient')

        // Verify token works
        try {
          console.log('[BaseAppAuthStrategy] Verifying token with /auth/me...')
          const testAuth = await authApi.checkAuth()
          console.log('[BaseAppAuthStrategy] ✅ Token verification SUCCESS:', testAuth)
        } catch (err) {
          console.error('[BaseAppAuthStrategy] ❌ Token verification failed:', err)
        }
      }

      // Step 4: Create authenticated user
      const finalUser: User = {
        id: userData.id,
        walletAddress: userData.walletAddress,
        platform: Platform.BASE_APP,
        metadata: {
          ...userData,
          fid,
          username: sdkContext.user?.username,
          displayName: sdkContext.user?.displayName,
          pfpUrl: sdkContext.user?.pfpUrl,
          isAuthenticated: true,
          authMethod: 'quick_auth'
        }
      }

      console.log('[BaseAppAuthStrategy] Authentication successful, user:', finalUser)
      setUser(finalUser)
      setAuthState(AuthState.AUTHENTICATED)
      setIsLoading(false)
      useAuthStore.getState().setUser(finalUser as any)
      useAuthStore.getState().setLoading(false)
      console.log('[BaseAppAuthStrategy] User set in store:', useAuthStore.getState().user)

      return { success: true, user: finalUser }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[BaseAppAuthStrategy] Authentication error:', err)
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

      // Clear stored token
      if (typeof window !== 'undefined') {
        const { apiClient } = await import('@/lib/api/client')
        apiClient.clearAuthToken()
      }

      useAuthStore.getState().logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }, [])

  // Check if we have stored token on mount (ONCE)
  // Prevent duplicate /auth/me requests by using global flag
  useEffect(() => {
    if (!sdkContext || hasCheckedToken.current) return

    const { isAuthStrategyReady, setAuthStrategyReady } = useAuthStore.getState()

    // Skip if any other strategy instance already checked
    if (isAuthStrategyReady) {
      console.log('[BaseAppAuthStrategy] Skipping auth check - strategy already ready')
      hasCheckedToken.current = true
      return
    }

    hasCheckedToken.current = true

    // Mark as ready IMMEDIATELY to prevent race conditions
    setAuthStrategyReady(true)

    // Check if we have a stored auth token from previous session
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        console.log('[BaseAppAuthStrategy] Found stored token, verifying...')
        // Verify token is still valid
        authApi.checkAuth().then((userData) => {
          if (userData) {
            console.log('[BaseAppAuthStrategy] Stored token valid, restoring session')
            const restoredUser: User = {
              id: userData.id,
              walletAddress: userData.walletAddress,
              platform: Platform.BASE_APP,
              metadata: userData
            }
            setUser(restoredUser)
            setAuthState(AuthState.AUTHENTICATED)
            useAuthStore.getState().setUser(restoredUser as any)
          } else {
            console.log('[BaseAppAuthStrategy] Stored token invalid')
            setAuthState(AuthState.UNAUTHENTICATED)
          }
        }).catch(() => {
          console.log('[BaseAppAuthStrategy] Token verification failed')
          setAuthState(AuthState.UNAUTHENTICATED)
          localStorage.removeItem('auth_token')
        })
      } else {
        // No stored token - user needs to authenticate
        setAuthState(AuthState.UNAUTHENTICATED)
      }
    }
  }, [sdkContext])

  const checkAuthStatus = useCallback(async () => {
    try {
      const ctx = await sdk.context
      setAuthState(ctx.user ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED)
    } catch (err) {
      setAuthState(AuthState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    }
  }, [])

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
