import {
  IAuthProvider,
  AuthResult,
  Session,
  User,
  AuthState
} from '../../_core/shared/interfaces/IAuthProvider'
import { authApi } from '@/lib/api/auth'
import { Platform } from '../../config'

export class WebAuthProvider implements IAuthProvider {
  private authStateCallbacks: Set<(state: AuthState) => void> = new Set()
  private currentState: AuthState = AuthState.UNAUTHENTICATED
  
  constructor(
    private wagmiAccount: { address?: string; isConnected: boolean },
    private signMessage: (message: string) => Promise<string>
  ) {}
  
  async connect(): Promise<AuthResult> {
    if (!this.wagmiAccount.isConnected || !this.wagmiAccount.address) {
      return {
        success: false,
        error: 'Wallet not connected'
      }
    }

    try {
      this.setState(AuthState.LOADING)

      console.log('[WebAuth] Starting authentication on Web platform for address:', this.wagmiAccount.address)

      // Step 1: Get nonce from backend
      const { message, jwtToken } = await authApi.getNonce(this.wagmiAccount.address)
      console.log('[WebAuth] Got nonce and jwtToken')

      // Step 2: Sign message with wagmi
      const signature = await this.signMessage(message)
      console.log('[WebAuth] Message signed')

      // Step 3: Verify signature with backend using JWT token
      // Backend sets HttpOnly cookie in response
      const { user: userData } = await authApi.connectWallet({
        walletAddress: this.wagmiAccount.address,
        signature,
        message,
        jwtToken,
      })
      console.log('[WebAuth] Backend verified signature, user:', userData)
      console.log('[WebAuth] HttpOnly cookie should be set by backend')

      // Return full user data without wrapping in metadata
      const user: User = userData as User

      this.setState(AuthState.AUTHENTICATED)

      console.log('[WebAuth] Success on Web platform, verifying HttpOnly cookie...')

      // Verify that HttpOnly cookie was set correctly
      try {
        const verifyUser = await authApi.checkAuth()
        console.log('[WebAuth] ✅ HttpOnly cookie verification SUCCESS - user from /auth/me:', verifyUser)
      } catch (err) {
        console.error('[WebAuth] ❌ HttpOnly cookie verification FAILED:', err)
        throw new Error('Authentication failed: HttpOnly cookie was not set by backend')
      }

      return {
        success: true,
        user
      }
      
    } catch (error: any) {
      this.setState(AuthState.ERROR)
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      // Backend clears HttpOnly cookie
      await authApi.disconnect()
      console.log('[WebAuth] HttpOnly cookie cleared by backend')
    } catch (error) {
      console.warn('[WebAuth] Logout API call failed:', error)
    }

    this.setState(AuthState.UNAUTHENTICATED)
  }
  
  async getSession(): Promise<Session | null> {
    // Check if we have a valid JWT token in cookies
    try {
      const userData = await authApi.checkAuth()
      if (userData) {
        return {
          id: 'web-session',
          userId: userData.id,
          walletAddress: userData.walletAddress,
          platform: Platform.WEB,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      }
    } catch (error) {
      console.warn('Failed to get session:', error)
    }

    return null
  }
  
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await authApi.checkAuth()
      if (userData) {
        // Return full user data without wrapping in metadata
        return userData as User
      }
    } catch (error) {
      console.warn('Failed to get current user:', error)
    }

    return null
  }
  
  async getWalletAddress(): Promise<string | null> {
    return this.wagmiAccount.address || null
  }
  
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateCallbacks.add(callback)
    
    // Immediately call with current state
    callback(this.currentState)
    
    return () => {
      this.authStateCallbacks.delete(callback)
    }
  }
  
  private setState(state: AuthState): void {
    if (this.currentState !== state) {
      this.currentState = state
      this.authStateCallbacks.forEach(callback => callback(state))
    }
  }
  
  // Additional methods for Web platform
  getCurrentState(): AuthState {
    return this.currentState
  }
  
  updateWagmiAccount(account: { address?: string; isConnected: boolean }): void {
    this.wagmiAccount = account

    // Update state based on connection status
    if (!account.isConnected) {
      this.setState(AuthState.UNAUTHENTICATED)
    }
  }

  // IAuthProvider required alias methods
  async authenticate(): Promise<AuthResult> {
    return this.connect()
  }

  async logout(): Promise<void> {
    return this.disconnect()
  }

  async checkAuthStatus(): Promise<void> {
    const user = await this.getCurrentUser()
    if (user) {
      this.setState(AuthState.AUTHENTICATED)
    } else {
      this.setState(AuthState.UNAUTHENTICATED)
    }
  }

  // IAuthProvider required getters
  get isAuthenticated(): boolean {
    return this.currentState === AuthState.AUTHENTICATED
  }

  get isLoading(): boolean {
    return this.currentState === AuthState.LOADING
  }

  get error(): string | null {
    return null
  }

  get user(): User | null {
    return null // Web provider doesn't cache user, use getCurrentUser() instead
  }

  get platform(): string {
    return Platform.WEB
  }

  get authState(): AuthState {
    return this.currentState
  }

  get canAuthenticate(): boolean {
    return this.wagmiAccount.isConnected && !!this.wagmiAccount.address
  }
}