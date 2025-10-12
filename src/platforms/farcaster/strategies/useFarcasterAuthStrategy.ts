'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { FarcasterAuthProvider } from '../providers/FarcasterAuthProvider'
import { AuthState, User } from '../../_core/shared/interfaces/IAuthProvider'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'

export function useFarcasterAuthStrategy(): IAuthStrategy {
  const miniKit = useMiniKit()
  const [miniAppSdk, setMiniAppSdk] = useState<any>(null)

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if we're in Farcaster context
  const isFarcaster = useMemo(() => {
    const clientFid = (miniKit.context as any)?.client?.fid ||
                      (miniKit.context as any)?.client?.clientFid
    return clientFid === '1' // Farcaster clientFid
  }, [miniKit.context])

  // Load Farcaster SDK for quickAuth (Farcaster-specific feature)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isFarcaster) return // Don't load SDK if not on Farcaster

    console.log('[FarcasterAuthStrategy] Loading Farcaster SDK')
    import('@farcaster/miniapp-sdk').then((module) => {
      const sdk = module.default || module
      setMiniAppSdk(sdk)
      console.log('[FarcasterAuthStrategy] Farcaster SDK loaded')
    }).catch((err) => {
      console.error('[useFarcasterAuthStrategy] Failed to load Farcaster SDK:', err)
    })
  }, [isFarcaster])

  // Create auth provider with both MiniKit context (OnChainKit) and Farcaster SDK (quickAuth)
  const authProvider = useMemo(() => {
    if (!isFarcaster || !miniAppSdk) return null
    console.log('[FarcasterAuthStrategy] Creating auth provider')
    return new FarcasterAuthProvider(miniKit, miniAppSdk)
  }, [isFarcaster, miniKit, miniAppSdk])

  // Set up auth state listener
  useEffect(() => {
    if (!authProvider) return

    const unsubscribe = authProvider.onAuthStateChange((state) => {
      setAuthState(state)
      setIsLoading(state === AuthState.LOADING)
    })

    return unsubscribe
  }, [authProvider])

  // Update user when authenticated or when context changes
  useEffect(() => {
    if (authState === AuthState.AUTHENTICATED && authProvider) {
      authProvider.getCurrentUser().then(setUser).catch(console.error)
    } else if (authProvider) {
      // Try to get user from context even if not authenticated
      authProvider.getCurrentUser().then(setUser).catch(() => setUser(null))
    } else {
      setUser(null)
    }
  }, [authState, authProvider])

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (!authProvider) {
      const error = 'Farcaster platform not initialized'
      setError(error)
      return { success: false, error }
    }

    try {
      setError(null)
      const result = await authProvider.connect()

      if (result.success) {
        setUser(result.user || null)
        return { success: true, user: result.user }
      } else {
        setError(result.error || 'Authentication failed')
        return { success: false, error: result.error }
      }
    } catch (err) {
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

  // Check auth status on mount and when authProvider changes
  useEffect(() => {
    if (!authProvider) return

    checkAuthStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authProvider])

  return {
    user,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING || isLoading,
    error,
    authenticate,
    logout,
    checkAuthStatus,
    canAuthenticate: !!authProvider && !!miniAppSdk,
  }
}
