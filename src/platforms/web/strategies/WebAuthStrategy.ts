'use client'

import { WebAuthProvider, AuthState, User } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { useAuthStore } from '@/lib/store'
import { Platform } from '@/src/platforms/config'

/**
 * Web authentication strategy class
 * Implements IAuthStrategy with Dependency Injection (no React hooks)
 */
export class WebAuthStrategy implements IAuthStrategy {
  private _user: User | null = null
  private _authState: AuthState = AuthState.UNAUTHENTICATED
  private _isLoading: boolean = false
  private _error: string | null = null
  private _authProvider: WebAuthProvider | null = null
  private _unsubscribe: (() => void) | null = null

  constructor(
    private wagmiAccount: { address: string | undefined; isConnected: boolean },
    private signMessageFn: (message: string) => Promise<string>,
    private checkAuthOnInit: boolean = false
  ) {
    this.initialize()
  }

  private initialize() {
    // Sync authState with user from store
    const storeUser = useAuthStore.getState().user
    if (storeUser) {
      this._authState = AuthState.AUTHENTICATED
      this._user = { ...storeUser, platform: Platform.WEB } as any
    } else {
      this._authState = AuthState.UNAUTHENTICATED
    }

    // Create auth provider if we have an address
    if (this.wagmiAccount.address) {
      this._authProvider = new WebAuthProvider(
        this.wagmiAccount,
        async (message: string) => this.signMessageFn(message)
      )

      // Set up auth state listener
      this._unsubscribe = this._authProvider.onAuthStateChange((state) => {
        const currentUser = useAuthStore.getState().user
        if (currentUser && state === AuthState.UNAUTHENTICATED) {
          return
        }

        this._authState = state
        this._isLoading = state === AuthState.LOADING
        useAuthStore.getState().setLoading(this._isLoading)
      })
    }

    // Check auth status on initialization if requested
    if (this.checkAuthOnInit && this.canAuthenticate) {
      const { initialized, isAuthStrategyReady } = useAuthStore.getState()
      if (!initialized && !isAuthStrategyReady) {
        this.checkAuthStatus()
      }
    }
  }

  // State getters
  get user(): User | null {
    const storeUser = useAuthStore.getState().user
    return storeUser ? { ...storeUser, platform: Platform.WEB } as any : null
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
    return this.wagmiAccount.isConnected && !!this.wagmiAccount.address && !!this._authProvider
  }

  // Update wagmi account info (called when wallet changes)
  updateWagmiAccount(account: { address: string | undefined; isConnected: boolean }) {
    this.wagmiAccount = account

    if (this._authProvider) {
      this._authProvider.updateWagmiAccount(account)
    } else if (account.address) {
      // Create provider if we now have an address
      this._authProvider = new WebAuthProvider(
        account,
        async (message: string) => this.signMessageFn(message)
      )
    }
  }

  // Core methods
  authenticate = async (): Promise<AuthResult> => {
    if (!this._authProvider) {
      const error = 'Web platform not initialized'
      this._error = error
      return { success: false, error }
    }

    if (!this.wagmiAccount.isConnected || !this.wagmiAccount.address) {
      const error = 'Wallet not connected'
      this._error = error
      return { success: false, error }
    }

    try {
      this._error = null
      const result = await this._authProvider.connect()

      if (result.success) {
        this._authState = AuthState.AUTHENTICATED
        this._user = result.user || null
        useAuthStore.getState().setUser(result.user as any || null)
        return { success: true, user: result.user }
      } else {
        this._error = result.error || 'Authentication failed'
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[WebAuthStrategy] Authentication error:', err)
      this._error = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  logout = async () => {
    if (!this._authProvider) return

    try {
      this._error = null
      await this._authProvider.disconnect()
      useAuthStore.getState().logout()
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Logout failed'
    }
  }

  checkAuthStatus = async () => {
    if (!this._authProvider) return

    try {
      const currentUser = await this._authProvider.getCurrentUser()
      this._authState = currentUser ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED
      useAuthStore.getState().setUser(currentUser as any)
    } catch (err) {
      this._authState = AuthState.ERROR
      this._error = err instanceof Error ? err.message : 'Failed to check auth status'
    }
  }

  // Cleanup
  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = null
    }
  }
}
