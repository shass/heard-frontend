'use client'

import { WebAuthProvider } from '@/src/platforms'
import { IAuthStrategy, AuthResult } from '../../_core/shared/interfaces/IAuthStrategy'
import { useAuthStore } from '@/lib/store'

/**
 * Web authentication strategy (stateless)
 * All auth state lives in useAuthStore — strategy only orchestrates transitions
 */
export class WebAuthStrategy implements IAuthStrategy {
  private _authProvider: WebAuthProvider | null = null
  constructor(
    private wagmiAccount: { address: string | undefined; isConnected: boolean },
    private signMessageFn: (message: string) => Promise<string>
  ) {
    // Create auth provider if we have an address
    if (this.wagmiAccount.address) {
      this._authProvider = new WebAuthProvider(
        this.wagmiAccount,
        async (message: string) => this.signMessageFn(message)
      )
    }
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

  authenticate = async (): Promise<AuthResult> => {
    if (!this._authProvider) {
      const error = 'Web platform not initialized'
      useAuthStore.getState().authFailure(error)
      return { success: false, error }
    }

    if (!this.wagmiAccount.isConnected || !this.wagmiAccount.address) {
      const error = 'Wallet not connected'
      useAuthStore.getState().authFailure(error)
      return { success: false, error }
    }

    try {
      useAuthStore.getState().startAuth()
      const result = await this._authProvider.connect()

      if (result.success && result.user) {
        useAuthStore.getState().authSuccess(result.user as any)
        return { success: true, user: result.user }
      } else {
        const errorMsg = result.error || 'Authentication failed'
        useAuthStore.getState().authFailure(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('[WebAuthStrategy] Authentication error:', err)
      useAuthStore.getState().authFailure(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  logout = async () => {
    if (this._authProvider) {
      try {
        await this._authProvider.disconnect()
      } catch (err) {
        console.error('[WebAuthStrategy] Logout error:', err)
      }
    }
    useAuthStore.getState().logout()
  }

  checkAuthStatus = async () => {
    if (!this._authProvider) return

    try {
      const currentUser = await this._authProvider.getCurrentUser()
      if (currentUser) {
        useAuthStore.getState().authSuccess(currentUser as any)
      } else {
        useAuthStore.getState().setUser(null)
        useAuthStore.getState().setLoading(false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check auth status'
      console.error('[WebAuthStrategy] checkAuthStatus error:', err)
      useAuthStore.getState().authFailure(errorMessage)
    }
  }

  destroy() {
    // No-op: reserved for future cleanup logic
  }
}
