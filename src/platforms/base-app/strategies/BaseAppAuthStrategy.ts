'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { Platform } from '../../config'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'

/**
 * Base App authentication strategy class (stateless)
 * All auth state lives in useAuthStore. Strategy only contains business logic.
 * Uses OnchainKit MiniKit Quick Auth for verified authentication.
 */
export class BaseAppAuthStrategy implements IAuthStrategy {
  constructor(
    private context: any
  ) {}

  /** Update MiniKit context when it changes (mirrors WebAuthStrategy.updateWagmiAccount) */
  updateContext(context: any) {
    this.context = context
  }

  get canAuthenticate(): boolean {
    return !!this.context
  }

  checkAuthStatus = async (): Promise<void> => {
    if (typeof window === 'undefined') {
      useAuthStore.getState().setUser(null)
      useAuthStore.getState().setLoading(false)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      // No saved session — don't auto-authenticate, let the UI trigger auth on user action
      useAuthStore.getState().setLoading(false)
      return
    }

    try {
      console.log('[BaseAppAuthStrategy] Restoring session from token...')
      useAuthStore.getState().setLoading(true)

      const { apiClient } = await import('@/lib/api/client')
      apiClient.setAuthToken(token)

      const userData = await authApi.checkAuth()

      if (userData) {
        const storeUser = {
          ...userData,
          platform: Platform.BASE_APP,
        }
        useAuthStore.getState().authSuccess(storeUser)
      } else {
        apiClient.clearAuthToken()
        // Token invalid — don't auto-authenticate, let the UI trigger auth on user action
        useAuthStore.getState().setLoading(false)
      }
    } catch (err) {
      console.warn('[BaseAppAuthStrategy] Failed to restore session:', err)
      const { apiClient } = await import('@/lib/api/client')
      apiClient.clearAuthToken()
      // Session restoration failed — don't auto-authenticate, let the UI trigger auth on user action
      useAuthStore.getState().setLoading(false)
    }
  }

  authenticate = async (): Promise<AuthResult> => {
    if (!this.context) {
      useAuthStore.getState().authFailure('Base App context not available')
      return { success: false, error: 'Base App context not available' }
    }

    try {
      useAuthStore.getState().startAuth()

      // Clear old token
      const { apiClient } = await import('@/lib/api/client')
      apiClient.clearAuthToken()

      const fid = this.context.user?.fid
      if (!fid) {
        throw new Error('No Farcaster ID found in context')
      }

      // Get Quick Auth token
      const { token: quickAuthToken } = await sdk.quickAuth.getToken()
      if (!quickAuthToken) {
        throw new Error('Failed to get Quick Auth token')
      }

      // Get wallet address
      let walletAddress: string | undefined
      try {
        const provider = await sdk.wallet.getEthereumProvider()
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' })
          walletAddress = accounts[0]?.toLowerCase()
        }
      } catch (err) {
        console.warn('[BaseAppAuthStrategy] Could not get wallet address:', err)
      }

      if (!walletAddress) {
        throw new Error('Wallet address is required for Base App authentication. Please ensure your wallet is connected.')
      }

      // Authenticate with backend
      const { user: userData, token } = await authApi.connectWallet({
        platform: 'base',
        walletAddress,
        quickAuthToken,
        metadata: {
          fid,
          username: this.context.user?.username,
          displayName: this.context.user?.displayName,
          pfpUrl: this.context.user?.pfpUrl,
          authMethod: 'quick_auth',
        }
      })

      // Store token
      if (token) {
        apiClient.setAuthToken(token)
      }

      // Create store user and update store
      const storeUser = {
        ...userData,
        platform: Platform.BASE_APP,
      }
      useAuthStore.getState().authSuccess(storeUser)

      // Return platform User for AuthResult
      const finalUser: User = {
        id: userData.id,
        walletAddress: userData.walletAddress,
        platform: Platform.BASE_APP,
        metadata: {
          ...userData,
          fid,
          username: this.context.user?.username,
          displayName: this.context.user?.displayName,
          pfpUrl: this.context.user?.pfpUrl,
          isAuthenticated: true,
          isVerified: true,
          authMethod: 'quick_auth'
        }
      }

      return { success: true, user: finalUser }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[BaseAppAuthStrategy] Authentication error:', err)
      useAuthStore.getState().authFailure(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  logout = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      const { apiClient } = await import('@/lib/api/client')
      apiClient.clearAuthToken()
    }

    useAuthStore.getState().logout()
  }
}
