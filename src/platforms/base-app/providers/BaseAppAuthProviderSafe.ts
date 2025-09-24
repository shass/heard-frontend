import { 
  IAuthProvider, 
  AuthResult, 
  Session, 
  User, 
  AuthState 
} from '../../shared/interfaces/IAuthProvider'

// Type definitions for MiniKit hooks (when available)
interface MiniKitContext {
  context?: {
    user?: {
      fid?: number
      username?: string
      displayName?: string
      pfpUrl?: string
      custody?: {
        address?: string
      }
      verifications?: string[]
    }
    client?: {
      clientFid?: number
      name?: string
    }
  }
}

interface AuthenticateHook {
  signIn?: (params: {
    domain: string
    siweUri: string
  }) => Promise<any>
}

export class BaseAppAuthProviderSafe implements IAuthProvider {
  private authStateCallbacks: Set<(state: AuthState) => void> = new Set()
  private currentState: AuthState = AuthState.UNAUTHENTICATED
  private isAvailable: boolean = false
  private currentUser: User | null = null
  private currentError: string | null = null
  private currentLoading: boolean = false
  
  constructor(
    private miniKitContext?: MiniKitContext | null,
    private authenticateHook?: AuthenticateHook | null
  ) {
    // Check if hooks are actually available
    this.isAvailable = !!(miniKitContext && authenticateHook)
    
    if (!this.isAvailable) {
      console.warn('[BaseAppAuth] MiniKit hooks not available - auth will be limited')
      this.currentError = 'MiniKit not available - cannot authenticate'
      this.setState(AuthState.ERROR)
    } else {
      // Initialize state based on context
      this.initializeFromContext()
    }
  }
  
  private initializeFromContext(): void {
    if (!this.isAvailable) return
    
    // Check if we already have context (user is authenticated)
    if (this.miniKitContext?.context?.user) {
      this.setState(AuthState.AUTHENTICATED)
    } else {
      this.setState(AuthState.UNAUTHENTICATED)
    }
  }
  
  async connect(): Promise<AuthResult> {
    if (!this.isAvailable) {
      const error = 'MiniKit not available - cannot authenticate'
      this.currentError = error
      return {
        success: false,
        error: error
      }
    }
    
    try {
      this.currentLoading = true
      this.currentError = null
      this.setState(AuthState.LOADING)
      
      console.log('[BaseAppAuth] Starting MiniKit authentication')
      
      // Check if signIn method exists
      if (!this.authenticateHook?.signIn) {
        throw new Error('Authentication hook signIn method not available')
      }
      
      // Use MiniKit's authenticate hook with SIWE (Sign In with Ethereum)
      const authResult = await this.authenticateHook.signIn({
        domain: window.location.hostname,
        siweUri: window.location.origin + '/api/auth/siwe',
        // Add nonce and other SIWE params if needed
      })
      
      if (!authResult) {
        this.currentError = 'MiniKit authentication failed'
        this.setState(AuthState.ERROR)
        return {
          success: false,
          error: this.currentError || undefined
        }
      }
      
      // Create user object from MiniKit context
      const user: User = {
        id: (authResult as any).fid?.toString() || 
            this.miniKitContext?.context?.user?.fid?.toString() || 
            'unknown',
        walletAddress: (authResult as any).address,
        platform: 'base-app',
        metadata: {
          fid: (authResult as any).fid,
          username: (authResult as any).username,
          displayName: (authResult as any).displayName,
          pfpUrl: (authResult as any).pfpUrl,
          address: (authResult as any).address,
          miniKitContext: this.miniKitContext?.context
        }
      }
      
      this.currentUser = user
      this.currentLoading = false
      this.setState(AuthState.AUTHENTICATED)
      
      console.log('[BaseAppAuth] MiniKit authentication successful')
      
      return {
        success: true,
        user
      }
      
    } catch (error: any) {
      console.error('[BaseAppAuth] Authentication error:', error)
      this.currentError = error.message || 'Base App authentication failed'
      this.currentLoading = false
      this.setState(AuthState.ERROR)
      return {
        success: false,
        error: this.currentError || undefined
      }
    }
  }
  
  async disconnect(): Promise<void> {
    // MiniKit doesn't have explicit logout, but we can clear our state
    this.currentUser = null
    this.currentError = null
    this.currentLoading = false
    this.setState(AuthState.UNAUTHENTICATED)
    console.log('[BaseAppAuth] Disconnected')
  }
  
  async getSession(): Promise<Session | null> {
    if (!this.isAvailable || !this.miniKitContext?.context?.user) {
      return null
    }
    
    return {
      id: `minikit-session-${this.miniKitContext.context.user.fid}`,
      userId: this.miniKitContext.context.user.fid?.toString() || 'unknown',
      walletAddress: this.miniKitContext.context.user.custody?.address,
      platform: 'base-app',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    if (!this.isAvailable || !this.miniKitContext?.context?.user) {
      return null
    }
    
    const contextUser = this.miniKitContext.context.user
    
    return {
      id: contextUser.fid?.toString() || 'unknown',
      walletAddress: contextUser.custody?.address,
      platform: 'base-app',
      metadata: {
        fid: contextUser.fid,
        username: contextUser.username,
        displayName: contextUser.displayName,
        pfpUrl: contextUser.pfpUrl,
        custody: contextUser.custody,
        verifications: contextUser.verifications,
        miniKitContext: this.miniKitContext.context
      }
    }
  }
  
  async getWalletAddress(): Promise<string | null> {
    if (!this.isAvailable) return null
    return this.miniKitContext?.context?.user?.custody?.address || null
  }

  // IAuthProvider required alias methods
  async authenticate(): Promise<AuthResult> {
    return this.connect()
  }

  async logout(): Promise<void> {
    return this.disconnect()
  }

  async checkAuthStatus(): Promise<void> {
    if (!this.isAvailable) {
      this.setState(AuthState.ERROR)
      return
    }

    try {
      const user = await this.getCurrentUser()
      if (user) {
        this.currentUser = user
        this.setState(AuthState.AUTHENTICATED)
      } else {
        this.currentUser = null
        this.setState(AuthState.UNAUTHENTICATED)
      }
    } catch (error: any) {
      this.currentError = error.message || 'Failed to check auth status'
      this.setState(AuthState.ERROR)
    }
  }

  // IAuthProvider required getters
  get isAuthenticated(): boolean {
    return this.currentState === AuthState.AUTHENTICATED
  }

  get isLoading(): boolean {
    return this.currentLoading || this.currentState === AuthState.LOADING
  }

  get error(): string | null {
    return this.currentError
  }

  get user(): User | null {
    return this.currentUser
  }

  get platform(): string {
    return 'base-app'
  }

  get authState(): AuthState {
    return this.currentState
  }

  get canAuthenticate(): boolean {
    return this.isAvailable && !!this.miniKitContext?.context
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
    return this.miniKitContext?.context
  }
  
  // Check if hooks are available
  isHooksAvailable(): boolean {
    return this.isAvailable
  }
  
  // Check if we have authenticated context (more secure)
  hasAuthenticatedContext(): boolean {
    // This uses the authenticated hook result, not just context
    return this.isAvailable && this.currentState === AuthState.AUTHENTICATED
  }
  
  // Check if we have basic context (less secure, could be spoofed)
  hasContextData(): boolean {
    return this.isAvailable && !!this.miniKitContext?.context?.user
  }
  
  // Get Farcaster ID if available
  getFid(): string | null {
    if (!this.isAvailable) return null
    return this.miniKitContext?.context?.user?.fid?.toString() || null
  }
  
  // Get client info
  getClientInfo() {
    if (!this.isAvailable) {
      return {
        clientFid: undefined,
        clientName: undefined,
        platform: 'base-app',
        available: false
      }
    }
    
    return {
      clientFid: this.miniKitContext?.context?.client?.clientFid,
      clientName: this.miniKitContext?.context?.client?.name,
      platform: 'base-app',
      available: true
    }
  }
}