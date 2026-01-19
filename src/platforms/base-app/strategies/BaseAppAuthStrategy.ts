'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { Platform } from '../../config'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api/auth'

/**
 * Base App authentication strategy class
 * Uses OnchainKit MiniKit Quick Auth for verified authentication
 */
export class BaseAppAuthStrategy implements IAuthStrategy {
  private _user: User | null = null
  private _authState: AuthState = AuthState.UNAUTHENTICATED
  private _isLoading: boolean = false
  private _error: string | null = null

  constructor(
    private context: any
  ) {
    this.initialize()
  }

  private initialize() {
    const storeUser = useAuthStore.getState().user
    if (storeUser) {
      this._user = { ...storeUser, platform: Platform.BASE_APP } as any
      this._authState = AuthState.AUTHENTICATED
    }

    useAuthStore.getState().setLoading(false)
  }

  get user(): User | null {
    return this._user
  }

  get authState(): AuthState {
    return this._authState
  }

  get isAuthenticated(): boolean {
    return this._authState === AuthState.AUTHENTICATED
  }

  get isLoading(): boolean {
    return this._authState === AuthState.LOADING || this._isLoading
  }

  get error(): string | null {
    return this._error
  }

  get canAuthenticate(): boolean {
    return !!this.context
  }

  authenticate = async (): Promise<AuthResult> => {
    if (!this.context) {
      this._error = 'Base App context not available'
      return { success: false, error: this._error }
    }

    try {
      this._error = null
      this._isLoading = true
      this._authState = AuthState.LOADING
      useAuthStore.getState().setLoading(true)

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
        const provider = sdk.wallet.ethProvider
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

      // Create authenticated user
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

      this._user = finalUser
      this._authState = AuthState.AUTHENTICATED
      this._isLoading = false
      useAuthStore.getState().setUser(finalUser as any)
      useAuthStore.getState().setLoading(false)

      return { success: true, user: finalUser }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[BaseAppAuthStrategy] Authentication error:', err)
      this._error = errorMessage
      this._authState = AuthState.ERROR
      this._isLoading = false
      useAuthStore.getState().setLoading(false)
      return { success: false, error: errorMessage }
    }
  }

  logout = async () => {
    try {
      this._error = null
      this._user = null
      this._authState = AuthState.UNAUTHENTICATED

      if (typeof window !== 'undefined') {
        const { apiClient } = await import('@/lib/api/client')
        apiClient.clearAuthToken()
      }

      useAuthStore.getState().logout()
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Logout failed'
    }
  }

  checkAuthStatus = async () => {
    try {
      const userData = await authApi.checkAuth()
      this._authState = userData ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED
    } catch (err) {
      this._authState = AuthState.ERROR
      this._error = err instanceof Error ? err.message : 'Failed to check auth status'
    }
  }
}
