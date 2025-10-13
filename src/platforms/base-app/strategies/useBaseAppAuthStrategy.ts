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

      // Step 1: Try to use Farcaster signIn (may not be needed for Base App)
      // Base App has auto-connected wallet, we might not need signIn at all
      console.log('[BaseAppAuthStrategy] Checking if signIn is needed...')

      let result
      try {
        // Try signIn with simple nonce
        const nonce = Date.now().toString()
        console.log('[BaseAppAuthStrategy] Calling sdk.actions.signIn with nonce:', nonce)
        result = await sdk.actions.signIn({ nonce })
        console.log('[BaseAppAuthStrategy] SignIn raw result:', result)
      } catch (signInError) {
        console.warn('[BaseAppAuthStrategy] SignIn failed, continuing without it:', signInError)
        // SignIn failed - this is OK for Base App, we can use wallet directly
        result = null
      }

      // Get wallet address from signIn result OR directly from Base Account
      let walletAddress: string | undefined

      if (result) {
        const custody = (result as any).custody || (sdkContext.user as any)?.custody
        const verifications = (result as any).verifications || (sdkContext.user as any)?.verifications || []
        walletAddress = (result as any).address ||
                       custody?.address ||
                       verifications[0]?.address ||
                       verifications.find((v: any) => v.protocol === 'ethereum')?.address
      }

      // If signIn failed or didn't provide wallet, get it from Base Account directly
      if (!walletAddress) {
        console.log('[BaseAppAuthStrategy] Getting wallet from Base Account...')
        const provider = sdk.wallet.ethProvider
        if (!provider) {
          throw new Error('Ethereum provider not available')
        }

        const accounts = await provider.request({ method: 'eth_accounts' }) as string[]
        walletAddress = accounts[0]
      }

      if (!walletAddress) {
        throw new Error('No wallet address found')
      }

      console.log('[BaseAppAuthStrategy] Wallet address:', walletAddress)

      // Step 2: Get nonce from backend for JWT token generation
      console.log('[BaseAppAuthStrategy] Getting nonce from backend...')
      const { message: backendMessage, jwtToken } = await authApi.getNonce(walletAddress)
      console.log('[BaseAppAuthStrategy] Got nonce, message:', backendMessage)

      // Step 3: Sign the backend message using Base Account
      const provider = sdk.wallet.ethProvider
      if (!provider) {
        throw new Error('Ethereum provider not available')
      }

      console.log('[BaseAppAuthStrategy] Signing message with Base Account...')
      console.log('[BaseAppAuthStrategy] Message to sign:', backendMessage)
      console.log('[BaseAppAuthStrategy] Wallet address:', walletAddress)

      let backendSignature: string
      try {
        // Try different parameter formats
        // Some providers expect [message, address], others [address, message]
        const sig = await provider.request({
          method: 'personal_sign',
          params: [backendMessage as any, walletAddress as any]
        })
        backendSignature = sig as string
        console.log('[BaseAppAuthStrategy] Signature obtained:', backendSignature)
      } catch (signError) {
        console.error('[BaseAppAuthStrategy] personal_sign failed:', signError)
        // Try eth_sign as fallback
        try {
          console.log('[BaseAppAuthStrategy] Trying eth_sign instead...')
          const sig = await provider.request({
            method: 'eth_sign',
            params: [walletAddress as any, backendMessage as any]
          })
          backendSignature = sig as string
          console.log('[BaseAppAuthStrategy] eth_sign signature obtained:', backendSignature)
        } catch (ethSignError) {
          console.error('[BaseAppAuthStrategy] eth_sign also failed:', ethSignError)
          throw new Error(`Failed to sign message: ${signError instanceof Error ? signError.message : String(signError)}`)
        }
      }

      console.log('[BaseAppAuthStrategy] Successfully signed backend message')

      // Step 4: Connect wallet to backend and get JWT cookie
      const { user: userData } = await authApi.connectWallet({
        walletAddress,
        signature: backendSignature,
        message: backendMessage,
        jwtToken,
        platform: 'base',
        metadata: {
          fid: result ? (result as any).fid : sdkContext.user?.fid,
          username: result ? (result as any).username : sdkContext.user?.username,
          displayName: result ? (result as any).displayName : sdkContext.user?.displayName,
          pfpUrl: result ? (result as any).pfpUrl : sdkContext.user?.pfpUrl,
        }
      })

      console.log('[BaseAppAuthStrategy] Backend authentication successful:', userData)

      // Extract JWT token from cookie and store it for Authorization header
      // Since cookies don't work reliably in Base App iframe, we need to manually extract
      // the token and use Authorization header for subsequent requests
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
          console.log('[BaseAppAuthStrategy] Extracted token from cookie, storing for Authorization header')
          const { apiClient } = await import('@/lib/api/client')
          apiClient.setAuthToken(authToken)

          // Verify token works
          try {
            const testAuth = await authApi.checkAuth()
            console.log('[BaseAppAuthStrategy] Token verification SUCCESS:', testAuth)
          } catch (err) {
            console.error('[BaseAppAuthStrategy] Token verification failed:', err)
          }
        } else {
          console.warn('[BaseAppAuthStrategy] Could not extract auth_token from cookies')
        }
      }

      const authenticatedUser: User = {
        id: userData.id,
        walletAddress: userData.walletAddress,
        platform: Platform.BASE_APP,
        metadata: {
          ...userData,
          fid: result ? (result as any).fid : sdkContext.user?.fid,
          username: result ? (result as any).username : sdkContext.user?.username,
          displayName: result ? (result as any).displayName : sdkContext.user?.displayName,
          pfpUrl: result ? (result as any).pfpUrl : sdkContext.user?.pfpUrl,
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
