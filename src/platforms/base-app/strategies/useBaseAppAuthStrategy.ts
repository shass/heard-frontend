'use client'

import { useState, useEffect, useCallback } from 'react'
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

  // Get wallet address via Wagmi (Base Account is auto-connected in Base App)
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

      // Clear old token before authentication to prevent 401 on public endpoints
      console.log('[BaseAppAuthStrategy] Clearing old token before authentication...')
      const { apiClient } = await import('@/lib/api/client')
      apiClient.setAuthToken(null)

      // Step 1: Get wallet address from SDK provider
      console.log('[BaseAppAuthStrategy] Getting wallet address from SDK provider...')
      const provider = sdk.wallet.ethProvider
      if (!provider) {
        throw new Error('Ethereum provider not available in Base App')
      }

      const accounts = await provider.request({ method: 'eth_accounts' })
      const walletAddress = accounts[0]?.toLowerCase()

      if (!walletAddress) {
        throw new Error('No wallet address available')
      }

      console.log('[BaseAppAuthStrategy] Wallet address:', walletAddress)

      // Step 2: Get nonce and jwtToken from backend BEFORE signIn
      const nonceResponse = await authApi.getNonce(walletAddress)
      const { nonce, jwtToken } = nonceResponse
      console.log('[BaseApp] 📝 Backend nonce:', nonce)

      // Step 3: Use backend nonce in signIn
      let result
      try {
        result = await sdk.actions.signIn({ nonce })
        const signInMessage = (result as any).message as string

        // Extract nonce from SIWE message to compare
        const nonceInMessage = signInMessage.match(/Nonce: ([a-zA-Z0-9]+)/)?.[1]
        console.log('[BaseApp] 🔐 SDK generated SIWE message nonce:', nonceInMessage)
        console.log('[BaseApp] ✅ Nonces match:', nonce === nonceInMessage)

      } catch (signInError) {
        console.warn('[BaseAppAuthStrategy] SignIn failed:', signInError)
        throw new Error('SignIn failed: ' + (signInError instanceof Error ? signInError.message : 'Unknown error'))
      }

      // If signIn succeeded, we already have signature and message!
      if (result && (result as any).signature && (result as any).message) {
        const signInMessage = (result as any).message as string
        const signInSignature = (result as any).signature as string

        // Send signIn result to backend
        // Backend will verify SIWE signature format and return token
        const { user: userData, token } = await authApi.connectWallet({
          walletAddress,
          signature: signInSignature,
          message: signInMessage,
          jwtToken, // Required by backend
          platform: 'base',
          metadata: {
            fid: (result as any).fid || sdkContext.user?.fid,
            username: (result as any).username || sdkContext.user?.username,
            displayName: (result as any).displayName || sdkContext.user?.displayName,
            pfpUrl: (result as any).pfpUrl || sdkContext.user?.pfpUrl,
            authMethod: (result as any).authMethod,
          }
        })

        console.log('[BaseAppAuthStrategy] Backend authentication successful with signIn:', userData)

        // Use token from response body (Variant 1 - always returned by backend)
        if (token) {
          console.log('[BaseAppAuthStrategy] ✅ Got token from response body')
          const { apiClient } = await import('@/lib/api/client')
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
        } else {
          console.warn('[BaseAppAuthStrategy] ⚠️ No token in response body, falling back to cookie')
          // Fallback to cookie extraction for backwards compatibility
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split(';')
            let authToken = null
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=')
              if (name === 'auth_token') {
                authToken = value
                break
              }
            }

            if (authToken) {
              console.log('[BaseAppAuthStrategy] ✅ Extracted token from cookie')
              const { apiClient } = await import('@/lib/api/client')
              apiClient.setAuthToken(authToken)
            } else {
              console.error('[BaseAppAuthStrategy] ❌ No token available (neither response nor cookie)')
            }
          }
        }

        const authenticatedUser: User = {
          id: userData.id,
          walletAddress: userData.walletAddress,
          platform: Platform.BASE_APP,
          metadata: {
            ...userData,
            fid: (result as any).fid || sdkContext.user?.fid,
            username: (result as any).username || sdkContext.user?.username,
            displayName: (result as any).displayName || sdkContext.user?.displayName,
            pfpUrl: (result as any).pfpUrl || sdkContext.user?.pfpUrl,
            isAuthenticated: true
          }
        }

        console.log('[BaseAppAuthStrategy] Authentication successful, user:', authenticatedUser)
        setUser(authenticatedUser)
        setAuthState(AuthState.AUTHENTICATED)
        setIsLoading(false)
        useAuthStore.getState().setUser(authenticatedUser as any)
        useAuthStore.getState().setLoading(false)
        console.log('[BaseAppAuthStrategy] User set in store:', useAuthStore.getState().user)

        return { success: true, user: authenticatedUser }
      } else {
        // signIn failed - cannot proceed without signature
        throw new Error('Failed to get signature from Base App signIn')
      }
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
        apiClient.setAuthToken(null)
      }

      useAuthStore.getState().logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }, [])

  // Check if we have stored token on mount
  useEffect(() => {
    if (!sdkContext) return

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
