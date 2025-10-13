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

      // Step 1: Get signIn result from Farcaster SDK
      const nonce = crypto.randomUUID()
      const result = await sdk.actions.signIn({ nonce })

      if (result) {
        const custody = (result as any).custody || (sdkContext.user as any)?.custody
        const verifications = (result as any).verifications || (sdkContext.user as any)?.verifications || []
        const walletAddress = (result as any).address ||
                             custody?.address ||
                             verifications[0]?.address ||
                             verifications.find((v: any) => v.protocol === 'ethereum')?.address

        if (!walletAddress) {
          throw new Error('No wallet address found in sign in result')
        }

        console.log('[BaseAppAuthStrategy] SignIn successful, wallet:', walletAddress)

        // Step 2: Get nonce from backend for JWT token generation
        const { message: backendMessage, jwtToken } = await authApi.getNonce(walletAddress)

        // Step 3: Sign the backend message using Base Account
        const provider = sdk.wallet.ethProvider
        if (!provider) {
          throw new Error('Ethereum provider not available')
        }

        const backendSignature = await provider.request({
          method: 'personal_sign',
          params: [backendMessage as `0x${string}`, walletAddress as `0x${string}`]
        }) as string

        console.log('[BaseAppAuthStrategy] Signed backend message')

        // Step 4: Connect wallet to backend and get JWT cookie
        const { user: userData } = await authApi.connectWallet({
          walletAddress,
          signature: backendSignature,
          message: backendMessage,
          jwtToken,
          platform: 'base',
          metadata: {
            fid: (result as any).fid,
            username: (result as any).username,
            displayName: (result as any).displayName,
            pfpUrl: (result as any).pfpUrl,
          }
        })

        console.log('[BaseAppAuthStrategy] Backend authentication successful:', userData)

        const authenticatedUser: User = {
          id: userData.id,
          walletAddress: userData.walletAddress,
          platform: Platform.BASE_APP,
          metadata: {
            ...userData,
            fid: (result as any).fid,
            username: (result as any).username,
            displayName: (result as any).displayName,
            pfpUrl: (result as any).pfpUrl,
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
        setError('Authentication failed')
        setAuthState(AuthState.ERROR)
        setIsLoading(false)
        useAuthStore.getState().setLoading(false)
        return { success: false, error: 'Authentication failed' }
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
      useAuthStore.getState().logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }, [])

  useEffect(() => {
    if (!sdkContext) return
    setAuthState(sdkContext.user ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED)
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
