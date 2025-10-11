'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlatform } from '../../_core/PlatformContext'
import { BaseAppPlatformProvider } from '../BaseAppPlatformProvider'
import { AuthState, User } from '../../_core/shared/interfaces/IAuthProvider'
import { Platform } from '../../config'

// Safe imports with availability checks
let useMiniKit: any = null
let useAuthenticate: any = null

try {
  const onchainKit = require('@coinbase/onchainkit/minikit')
  useMiniKit = onchainKit.useMiniKit
  useAuthenticate = onchainKit.useAuthenticate
} catch (error) {
  console.warn('[BaseAppAuth] OnchainKit MiniKit not available:', error)
}

interface BaseAppAuthHookResult {
  user: User | null
  authState: AuthState
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  authenticate: () => Promise<void>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>
  hasContextData: boolean
  hasAuthenticatedContext: boolean
  fid: string | null
  username: string | null
  displayName: string | null
  pfpUrl: string | null
  custodyAddress: string | null
  verificationAddresses: string[]
  clientInfo: {
    clientFid?: number
    clientName?: string
  }
  securityNote: string
  canAuthenticate: boolean
  isHookAvailable: boolean
}

export function useBaseAppAuthSafe(): BaseAppAuthHookResult {
  const { provider } = usePlatform()
  
  // Safe hook usage with fallbacks
  const miniKit = useMiniKit ? useMiniKit() : null
  const authenticateHook = useAuthenticate ? useAuthenticate() : null
  
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if hooks are available
  const isHookAvailable = !!(useMiniKit && useAuthenticate)
  
  // Get Base App platform provider
  const baseAppProvider = provider instanceof BaseAppPlatformProvider ? provider : null
  const authProvider = baseAppProvider?.getAuthProvider()
  
  // Initialize provider with MiniKit hooks if available
  useEffect(() => {
    if (!isHookAvailable) {
      setError('OnchainKit MiniKit hooks not available')
      return
    }
    
    if (baseAppProvider && miniKit && authenticateHook) {
      const hooks = {
        miniKit,
        authenticate: authenticateHook,
        account: null, // Will be provided by parent component
        sendTransaction: null, // Will be provided by parent component  
        signMessage: null // Will be provided by parent component
      }
      
      baseAppProvider.initializeWithMiniKitHooks(hooks)
      console.log('[BaseAppAuth] Initialized with MiniKit hooks')
    }
  }, [baseAppProvider, miniKit, authenticateHook, isHookAvailable])
  
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
    if (!isHookAvailable) return
    
    if (authState === AuthState.AUTHENTICATED && authProvider) {
      authProvider.getCurrentUser().then(setUser).catch(console.error)
    } else if (miniKit?.context?.user) {
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
  }, [authState, authProvider, miniKit?.context?.user, isHookAvailable])
  
  const authenticate = useCallback(async () => {
    if (!isHookAvailable) {
      setError('OnchainKit MiniKit not available')
      return
    }
    
    if (!authProvider) {
      setError('Base App platform not initialized')
      return
    }
    
    try {
      setError(null)
      const result = await authProvider.connect()
      
      if (result.success) {
        setUser(result.user || null)
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    }
  }, [authProvider, isHookAvailable])
  
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
    if (!authProvider || !isHookAvailable) return
    
    try {
      const currentUser = await authProvider.getCurrentUser()
      setUser(currentUser)
      setAuthState(currentUser ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED)
    } catch (err) {
      setAuthState(AuthState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to check auth status')
    }
  }, [authProvider, isHookAvailable])
  
  // Check auth status on mount and when context changes
  useEffect(() => {
    if (isHookAvailable) {
      checkAuthStatus()
    }
  }, [checkAuthStatus, miniKit?.context, isHookAvailable])
  
  // Return safe defaults when hooks are not available
  if (!isHookAvailable) {
    return {
      user: null,
      authState: AuthState.ERROR,
      isAuthenticated: false,
      isLoading: false,
      error: 'OnchainKit MiniKit not available in this environment',
      authenticate: async () => { console.warn('MiniKit not available') },
      logout: async () => { console.warn('MiniKit not available') },
      checkAuthStatus: async () => { console.warn('MiniKit not available') },
      hasContextData: false,
      hasAuthenticatedContext: false,
      fid: null,
      username: null,
      displayName: null,
      pfpUrl: null,
      custodyAddress: null,
      verificationAddresses: [],
      clientInfo: {},
      securityNote: 'MiniKit not available',
      canAuthenticate: false,
      isHookAvailable: false
    }
  }
  
  return {
    user,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING || isLoading,
    error,
    authenticate,
    logout,
    checkAuthStatus,
    
    // Base App specific properties
    hasContextData: !!miniKit?.context?.user,
    hasAuthenticatedContext: authState === AuthState.AUTHENTICATED,
    fid: miniKit?.context?.user?.fid?.toString() || null,
    username: miniKit?.context?.user?.username || null,
    displayName: miniKit?.context?.user?.displayName || null,
    pfpUrl: miniKit?.context?.user?.pfpUrl || null,
    custodyAddress: (miniKit?.context?.user as any)?.custody?.address || null,
    verificationAddresses: (miniKit?.context?.user as any)?.verifications || [],
    
    // Client info
    clientInfo: {
      clientFid: miniKit?.context?.client?.clientFid,
      clientName: (miniKit?.context?.client as any)?.name
    },
    
    // Security note
    securityNote: authState === AuthState.AUTHENTICATED 
      ? 'Cryptographically verified identity' 
      : user?.metadata?.isFromContext 
        ? 'Context data only - not cryptographically verified'
        : 'Not authenticated',
        
    canAuthenticate: !!authProvider && !!miniKit?.context,
    isHookAvailable: true
  }
}