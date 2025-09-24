import { 
  IAuthProvider, 
  AuthResult, 
  Session, 
  User, 
  AuthState 
} from '../../shared/interfaces/IAuthProvider'
import { authApi } from '@/lib/api/auth'

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
      
      console.log('[WebAuth] Starting authentication on Web platform')
      
      // Step 1: Get nonce from backend
      const { message, jwtToken } = await authApi.getNonce(this.wagmiAccount.address)

      // Step 2: Sign message with wagmi
      const signature = await this.signMessage(message)

      // Step 3: Verify signature with backend using JWT token
      const { user: userData } = await authApi.connectWallet({
        walletAddress: this.wagmiAccount.address,
        signature,
        message,
        jwtToken,
      })

      const user: User = {
        id: userData.id,
        walletAddress: userData.walletAddress,
        platform: 'web',
        metadata: userData
      }

      this.setState(AuthState.AUTHENTICATED)
      
      console.log('[WebAuth] Success on Web platform')
      
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
      await authApi.disconnect()
    } catch (error) {
      console.warn('Logout API call failed:', error)
    }
    
    this.setState(AuthState.UNAUTHENTICATED)
  }
  
  async getSession(): Promise<Session | null> {
    // Check if we have a valid JWT token in cookies
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // Include cookies
      })
      
      if (response.ok) {
        const userData = await response.json()
        return {
          id: userData.sessionId || 'web-session',
          userId: userData.id,
          walletAddress: userData.walletAddress,
          platform: 'web',
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
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        return {
          id: userData.id,
          walletAddress: userData.walletAddress,
          platform: 'web',
          metadata: userData
        }
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
}