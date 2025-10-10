import {
  IAuthProvider,
  AuthResult,
  Session,
  User,
  AuthState
} from '../../shared/interfaces/IAuthProvider'
import { Platform } from '../../config'

// MiniKit specific imports
import { useMiniKit, useAuthenticate } from '@coinbase/onchainkit/minikit'

export class BaseAppAuthProvider implements IAuthProvider {
  private authStateCallbacks: Set<(state: AuthState) => void> = new Set()
  private currentState: AuthState = AuthState.UNAUTHENTICATED
  
  constructor(
    private miniKitContext: ReturnType<typeof useMiniKit>,
    private authenticateHook: ReturnType<typeof useAuthenticate>
  ) {
    // Initialize state based on context
    this.initializeFromContext()
  }
  
  private initializeFromContext(): void {
    // Check if we already have context (user is authenticated)
    if (this.miniKitContext.context?.user) {
      this.setState(AuthState.AUTHENTICATED)
    } else {
      this.setState(AuthState.UNAUTHENTICATED)
    }
  }
  
  async connect(): Promise<AuthResult> {
    try {
      this.setState(AuthState.LOADING)
      
      console.log('[BaseAppAuth] Starting MiniKit authentication')
      
      // Use MiniKit's authenticate hook with SIWE (Sign In with Ethereum)
      const authResult = await (this.authenticateHook as any).signIn({
        domain: window.location.hostname,
        siweUri: window.location.origin + '/api/auth/siwe',
        // Add nonce and other SIWE params if needed
      })
      
      if (!authResult) {
        this.setState(AuthState.ERROR)
        return {
          success: false,
          error: 'MiniKit authentication failed'
        }
      }
      
      // Create user object from MiniKit context
      const user: User = {
        id: (authResult as any).fid?.toString() || (this.miniKitContext.context?.user as any)?.fid?.toString() || 'unknown',
        walletAddress: (authResult as any).address,
        platform: Platform.BASE_APP,
        metadata: {
          fid: (authResult as any).fid,
          username: (authResult as any).username,
          displayName: (authResult as any).displayName,
          pfpUrl: (authResult as any).pfpUrl,
          address: (authResult as any).address,
          miniKitContext: this.miniKitContext.context
        }
      }
      
      this.setState(AuthState.AUTHENTICATED)
      
      console.log('[BaseAppAuth] MiniKit authentication successful')
      
      return {
        success: true,
        user
      }
      
    } catch (error: any) {
      console.error('[BaseAppAuth] Authentication error:', error)
      this.setState(AuthState.ERROR)
      return {
        success: false,
        error: error.message || 'Base App authentication failed'
      }
    }
  }
  
  async disconnect(): Promise<void> {
    // MiniKit doesn't have explicit logout, but we can clear our state
    this.setState(AuthState.UNAUTHENTICATED)
    console.log('[BaseAppAuth] Disconnected')
  }
  
  async getSession(): Promise<Session | null> {
    if (!this.miniKitContext.context?.user) {
      return null
    }
    
    return {
      id: `minikit-session-${this.miniKitContext.context.user.fid}`,
      userId: this.miniKitContext.context.user.fid?.toString() || 'unknown',
      walletAddress: (this.miniKitContext.context.user as any)?.custody?.address,
      platform: Platform.BASE_APP,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    if (!this.miniKitContext.context?.user) {
      return null
    }
    
    const contextUser = this.miniKitContext.context.user
    
    return {
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
        miniKitContext: this.miniKitContext.context
      }
    }
  }
  
  async getWalletAddress(): Promise<string | null> {
    return (this.miniKitContext.context?.user as any)?.custody?.address || null
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
  
  // Base App specific methods
  getCurrentState(): AuthState {
    return this.currentState
  }
  
  getMiniKitContext() {
    return this.miniKitContext.context
  }
  
  // Check if we have authenticated context (more secure)
  hasAuthenticatedContext(): boolean {
    // This uses the authenticated hook result, not just context
    return this.currentState === AuthState.AUTHENTICATED
  }
  
  // Check if we have basic context (less secure, could be spoofed)
  hasContextData(): boolean {
    return !!this.miniKitContext.context?.user
  }
  
  // Get Farcaster ID if available
  getFid(): string | null {
    return this.miniKitContext.context?.user?.fid?.toString() || null
  }
  
  // Get client info
  getClientInfo() {
    return {
      clientFid: this.miniKitContext.context?.client?.clientFid,
      clientName: (this.miniKitContext.context?.client as any)?.name,
      platform: Platform.BASE_APP
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
    // Re-check authentication state
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
    return null // This provider doesn't track errors in the same way
  }

  get user(): User | null {
    // Return current user synchronously based on context
    const contextUser = this.miniKitContext.context?.user
    if (!contextUser) return null

    return {
      id: contextUser.fid?.toString() || 'unknown',
      walletAddress: (contextUser as any).custody?.address,
      platform: Platform.BASE_APP,
      metadata: {
        fid: contextUser.fid,
        username: contextUser.username,
        displayName: contextUser.displayName,
        pfpUrl: contextUser.pfpUrl,
        custody: (contextUser as any).custody,
        verifications: (contextUser as any).verifications
      }
    }
  }

  get platform(): string {
    return Platform.BASE_APP
  }

  get authState(): AuthState {
    return this.currentState
  }

  get canAuthenticate(): boolean {
    return !!this.miniKitContext.context
  }
}