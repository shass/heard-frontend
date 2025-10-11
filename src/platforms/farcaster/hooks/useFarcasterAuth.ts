'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { FarcasterAuthProvider } from '../providers/FarcasterAuthProvider'
import { AuthState, User } from '../../_core/shared/interfaces/IAuthProvider'

export function useFarcasterAuth() {
  const miniKit = useMiniKit()
  const [miniAppSdk, setMiniAppSdk] = useState<any>(null)

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Farcaster SDK for quickAuth (Farcaster-specific feature)
  useEffect(() => {
    if (typeof window === 'undefined') return

    import('@farcaster/miniapp-sdk').then((module) => {
      const sdk = module.default || module
      setMiniAppSdk(sdk)
    }).catch((err) => {
      console.error('[useFarcasterAuth] Failed to load Farcaster SDK:', err)
    })
  }, [])

  // Create auth provider with both MiniKit context (OnChainKit) and Farcaster SDK (quickAuth)
  const authProvider = useMemo(() => {
    if (!miniAppSdk) return null
    return new FarcasterAuthProvider(miniKit, miniAppSdk)
  }, [miniKit, miniAppSdk])
  
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
  
  const authenticate = useCallback(async () => {
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
  
  // Get Quick Auth token
  const getQuickAuthToken = useCallback(async (): Promise<string | null> => {
    if (!authProvider || !('getQuickAuthToken' in authProvider)) {
      return null
    }
    
    try {
      return await (authProvider as any).getQuickAuthToken()
    } catch (error) {
      console.error('Failed to get Quick Auth token:', error)
      return null
    }
  }, [authProvider])
  
  // Make authenticated request
  const makeAuthenticatedRequest = useCallback(async (
    url: string, 
    options?: RequestInit
  ): Promise<Response | null> => {
    if (!authProvider || !('makeAuthenticatedRequest' in authProvider)) {
      return null
    }
    
    try {
      return await (authProvider as any).makeAuthenticatedRequest(url, options)
    } catch (error) {
      console.error('Authenticated request failed:', error)
      throw error
    }
  }, [authProvider])
  
  // Get Farcaster profile information
  const getFarcasterProfile = useCallback(async () => {
    if (!authProvider || !('getFarcasterProfile' in authProvider)) {
      return null
    }
    
    try {
      return await (authProvider as any).getFarcasterProfile()
    } catch (error) {
      console.error('Failed to get Farcaster profile:', error)
      return null
    }
  }, [authProvider])
  
  // Get social context
  const getSocialContext = useCallback(() => {
    if (!authProvider || !('getSocialContext' in authProvider)) {
      return null
    }
    
    return (authProvider as any).getSocialContext()
  }, [authProvider])
  
  // Check auth status on mount
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
    
    // Farcaster specific properties
    hasSocialContext: !!user,
    hasAuthenticatedContext: authState === AuthState.AUTHENTICATED,
    fid: user?.metadata?.fid || null,
    username: user?.metadata?.username || null,
    displayName: user?.metadata?.displayName || null,
    pfpUrl: user?.metadata?.pfpUrl || null,
    followerCount: user?.metadata?.followerCount || null,
    followingCount: user?.metadata?.followingCount || null,
    
    // Farcaster API methods
    getQuickAuthToken,
    makeAuthenticatedRequest,
    getFarcasterProfile,
    getSocialContext,
    
    // Security note
    securityNote: authState === AuthState.AUTHENTICATED 
      ? 'Cryptographically verified via Quick Auth' 
      : user?.metadata?.isFromContext 
        ? 'Context data only - not cryptographically verified'
        : 'Not authenticated',
        
    canAuthenticate: !!authProvider && !!miniAppSdk
  }
}