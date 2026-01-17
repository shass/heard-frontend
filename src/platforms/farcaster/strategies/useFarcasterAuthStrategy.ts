'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { sdk } from '@farcaster/miniapp-sdk'
import { AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { Platform } from '../../config'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'
import { toPlatformUser, toBackendUser } from '../../_core/shared/adapters/userAdapter'

/**
 * Farcaster authentication strategy using Farcaster MiniKit
 *
 * SECURITY ARCHITECTURE:
 * - useMiniKit().context provides UI hints ONLY (displayName, pfp, username)
 *   Context data can be spoofed and MUST NOT be used for authorization
 * - Quick Auth provides cryptographically verified authentication
 * - FID from context is used only for UI prefill, not for security decisions
 * - Backend verifies Quick Auth token for all authenticated operations
 *
 * @see https://miniapps.farcaster.xyz/docs/sdk/quick-auth
 */
export function useFarcasterAuthStrategy(): IAuthStrategy {
  // MiniKit context - USE ONLY FOR UI HINTS (can be spoofed)
  // Never use context data for authorization or security decisions
  const { context } = useMiniKit()

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasCheckedToken = useRef(false)

  // Initialize UI state based on context (UI hints only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useFarcasterAuthStrategy] Context updated:', context)
    }

    // Set loading to false initially
    useAuthStore.getState().setLoading(false)
  }, [])

  // Set guest user with context UI hints (NOT authenticated)
  // Context data is unverified and only used for display purposes
  useEffect(() => {
    let cancelled = false

    if (context?.user) {
      const contextUser = context.user

      // Try to get wallet address for display (not for auth)
      const getWalletAddress = async () => {
        try {
          const provider = await sdk.wallet.getEthereumProvider()
          if (provider) {
            const accounts = await provider.request({ method: 'eth_accounts' })
            return accounts[0]
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[useFarcasterAuthStrategy] Failed to get wallet address:', error)
          }
        }
        return undefined
      }

      getWalletAddress().then(walletAddress => {
        if (cancelled) return

        // Guest user with UI hints - NOT AUTHENTICATED
        // Do not use this for authorization
        const guestUser: User = {
          id: 'guest', // Not using FID as ID - it's unverified
          walletAddress: walletAddress,
          platform: Platform.FARCASTER,
          metadata: {
            // UI hints only - can be spoofed
            fid: contextUser.fid,
            username: contextUser.username,
            displayName: contextUser.displayName,
            pfpUrl: contextUser.pfpUrl,
            isFromContext: true,
            isVerified: false
          }
        }
        setUser(guestUser)
        useAuthStore.getState().setUser(toBackendUser(guestUser))
      })
    } else {
      if (!cancelled) {
        setUser(null)
        useAuthStore.getState().setUser(null)
      }
    }

    return () => {
      cancelled = true
    }
  }, [context])

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (!context) {
      setError('Farcaster context not available')
      return { success: false, error: 'Farcaster context not available' }
    }

    try {
      setError(null)
      setIsLoading(true)
      setAuthState(AuthState.LOADING)
      useAuthStore.getState().setLoading(true)

      // Clear old token before authentication
      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterAuthStrategy] Clearing old token before authentication...')
      }
      const { apiClient } = await import('@/lib/api/client')
      apiClient.clearAuthToken()

      // Step 1: Get FID from context (for UI prefill only)
      // NOTE: Context FID is unverified - backend will verify via Quick Auth
      const fid = context.user?.fid
      if (!fid) {
        throw new Error('No Farcaster ID found in context')
      }

      // Step 2: Use Quick Auth to get VERIFIED JWT token
      // Quick Auth provides cryptographically verified authentication
      // This is the ONLY source of truth for user identity
      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterAuthStrategy] Authenticating with Quick Auth for FID:', fid)
      }
      const { token: quickAuthToken } = await sdk.quickAuth.getToken()

      if (!quickAuthToken) {
        throw new Error('Failed to get Quick Auth token')
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterAuthStrategy] ✅ Quick Auth token obtained (VERIFIED)')
      }

      // Step 3: Get wallet address from SDK (required for survey access)
      let walletAddress: string | undefined
      try {
        const provider = await sdk.wallet.getEthereumProvider()
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' })
          walletAddress = accounts[0]?.toLowerCase()
          if (process.env.NODE_ENV === 'development') {
            console.log('[FarcasterAuthStrategy] Got wallet address from SDK:', walletAddress)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[FarcasterAuthStrategy] No Ethereum provider available')
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[FarcasterAuthStrategy] Could not get wallet address:', err)
        }
      }

      if (!walletAddress) {
        throw new Error('Wallet address is required for Farcaster authentication. Please ensure your wallet is connected.')
      }

      // Step 4: Send Quick Auth token and wallet address to backend
      // Backend MUST verify Quick Auth token server-side
      const { user: userData, token } = await authApi.connectWallet({
        platform: 'farcaster',
        walletAddress,
        quickAuthToken, // VERIFIED token - backend must validate
        metadata: {
          fid, // From context (unverified), used only for UI
          username: context.user?.username, // UI hint only
          displayName: context.user?.displayName, // UI hint only
          pfpUrl: context.user?.pfpUrl, // UI hint only
          authMethod: 'quick_auth',
        }
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterAuthStrategy] Backend authentication successful:', userData)
      }

      // Step 5: Store token
      if (token) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[FarcasterAuthStrategy] ✅ Got token from backend')
        }
        apiClient.setAuthToken(token)
        if (process.env.NODE_ENV === 'development') {
          console.log('[FarcasterAuthStrategy] Token stored in apiClient')
        }

        // Verify token works
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('[FarcasterAuthStrategy] Verifying token with /auth/me...')
          }
          const testAuth = await authApi.checkAuth()
          if (process.env.NODE_ENV === 'development') {
            console.log('[FarcasterAuthStrategy] ✅ Token verification SUCCESS:', testAuth)
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[FarcasterAuthStrategy] ❌ Token verification failed:', err)
          }
        }
      }

      // Step 6: Create VERIFIED authenticated user
      // userData comes from backend verification of Quick Auth token
      const finalUser: User = {
        id: userData.id, // Verified by backend
        walletAddress: userData.walletAddress, // Verified by backend
        platform: Platform.FARCASTER,
        metadata: {
          ...userData,
          fid, // From backend verification (not from context)
          username: context.user?.username, // UI hint for display
          displayName: context.user?.displayName, // UI hint for display
          pfpUrl: context.user?.pfpUrl, // UI hint for display
          isAuthenticated: true,
          isVerified: true, // Verified via Quick Auth + backend
          authMethod: 'quick_auth'
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterAuthStrategy] Authentication successful, user:', finalUser)
      }
      setUser(finalUser)
      setAuthState(AuthState.AUTHENTICATED)
      setIsLoading(false)
      useAuthStore.getState().setUser(toBackendUser(finalUser))
      useAuthStore.getState().setLoading(false)
      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterAuthStrategy] User set in store:', useAuthStore.getState().user)
      }

      return { success: true, user: finalUser }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[FarcasterAuthStrategy] Authentication error:', err)
      setError(errorMessage)
      setAuthState(AuthState.ERROR)
      setIsLoading(false)
      useAuthStore.getState().setLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [context])

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
    if (!context || hasCheckedToken.current) return

    const { isAuthStrategyReady, setAuthStrategyReady } = useAuthStore.getState()

    // Skip if any other strategy instance already checked
    if (isAuthStrategyReady) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterAuthStrategy] Skipping auth check - strategy already ready')
      }
      hasCheckedToken.current = true
      return
    }

    hasCheckedToken.current = true

    // Mark as ready IMMEDIATELY to prevent race conditions
    setAuthStrategyReady(true)

    // Check if we have a stored auth token from previous session
    // Token was verified by backend during previous authentication
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[FarcasterAuthStrategy] Found stored token, verifying...')
        }
        // Verify token is still valid
        authApi.checkAuth().then((userData) => {
          if (userData) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[FarcasterAuthStrategy] Stored token valid, restoring session')
            }
            const restoredUser: User = {
              id: userData.id, // From backend verification
              walletAddress: userData.walletAddress, // From backend verification
              platform: Platform.FARCASTER,
              metadata: {
                ...userData,
                isVerified: true, // Token was verified by backend
              }
            }
            setUser(restoredUser)
            setAuthState(AuthState.AUTHENTICATED)
            useAuthStore.getState().setUser(toBackendUser(restoredUser))
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('[FarcasterAuthStrategy] Stored token invalid')
            }
            setAuthState(AuthState.UNAUTHENTICATED)
          }
        }).catch(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[FarcasterAuthStrategy] Token verification failed')
          }
          setAuthState(AuthState.UNAUTHENTICATED)
          localStorage.removeItem('auth_token')
        })
      } else {
        // No stored token - user needs to authenticate
        setAuthState(AuthState.UNAUTHENTICATED)
      }
    }
  }, [context])

  const checkAuthStatus = useCallback(async () => {
    try {
      // Check if user is authenticated based on stored token verification
      // Do NOT use context.user for auth status (can be spoofed)
      const userData = await authApi.checkAuth()
      setAuthState(userData ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED)
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
    canAuthenticate: !!context, // Can authenticate if MiniKit context is available
  }
}
