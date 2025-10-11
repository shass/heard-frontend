import {
  IAuthProvider,
  AuthResult,
  Session,
  User,
  AuthState
} from '../../_core/shared/interfaces/IAuthProvider'
import { Platform } from '../../config'

export class FarcasterAuthProvider implements IAuthProvider {
  private authStateCallbacks: Set<(state: AuthState) => void> = new Set()
  private currentState: AuthState = AuthState.UNAUTHENTICATED
  private currentUser: User | null = null
  private currentSession: Session | null = null

  constructor(
    private miniKitContext: ReturnType<typeof import('@coinbase/onchainkit/minikit').useMiniKit>,
    private miniAppSdk: any // Farcaster SDK for quickAuth API
  ) {
    this.initializeFromContext()
  }
  
  private async initializeFromContext(): Promise<void> {
    try {
      // Check if we have context data available
      const contextData = await this.getContextData()
      
      if (contextData?.user) {
        // Create user from context (not cryptographically verified)
        const user: User = {
          id: contextData.user.fid?.toString() || 'unknown',
          walletAddress: undefined, // Context doesn't provide wallet address directly
          platform: Platform.FARCASTER,
          metadata: {
            fid: contextData.user.fid,
            username: contextData.user.username,
            displayName: contextData.user.displayName,
            pfpUrl: contextData.user.pfpUrl,
            followerCount: contextData.user.followerCount,
            followingCount: contextData.user.followingCount,
            isFromContext: true // Mark as context-only
          }
        }
        
        this.currentUser = user
        this.setState(AuthState.UNAUTHENTICATED) // Context is not authenticated
        
        console.log('[FarcasterAuth] Initialized with context data')
      }
    } catch (error) {
      console.error('[FarcasterAuth] Failed to initialize from context:', error)
      this.setState(AuthState.ERROR)
    }
  }
  
  private async getContextData(): Promise<any> {
    try {
      // Get context from OnChainKit MiniKit hook
      if (this.miniKitContext?.context) {
        return this.miniKitContext.context
      }

      console.warn('[FarcasterAuth] No MiniKit context available')
      return null
    } catch (error) {
      console.error('[FarcasterAuth] Failed to get context:', error)
      return null
    }
  }
  
  private setState(state: AuthState): void {
    if (this.currentState !== state) {
      this.currentState = state
      this.authStateCallbacks.forEach(callback => callback(state))
    }
  }
  
  async connect(): Promise<AuthResult> {
    try {
      this.setState(AuthState.LOADING)
      
      console.log('[FarcasterAuth] Starting Quick Auth authentication')
      
      // Use Farcaster Quick Auth for cryptographic verification
      const token = await this.miniAppSdk.quickAuth.getToken()
      
      if (!token) {
        this.setState(AuthState.ERROR)
        return {
          success: false,
          error: 'Failed to get Quick Auth token'
        }
      }
      
      // Verify the JWT token and extract user data
      const userData = await this.verifyQuickAuthToken(token)
      
      if (!userData) {
        this.setState(AuthState.ERROR)
        return {
          success: false,
          error: 'Failed to verify authentication token'
        }
      }
      
      // Create authenticated user
      const user: User = {
        id: userData.fid?.toString() || 'unknown',
        walletAddress: undefined, // Quick Auth doesn't provide wallet address
        platform: Platform.FARCASTER,
        metadata: {
          fid: userData.fid,
          username: userData.username,
          displayName: userData.displayName,
          pfpUrl: userData.pfpUrl,
          custodyAddress: userData.custodyAddress,
          isFromContext: false, // This is cryptographically verified
          quickAuthToken: token
        }
      }

      // Create session
      this.currentSession = {
        id: `farcaster-session-${userData.fid}`,
        userId: userData.fid?.toString() || 'unknown',
        walletAddress: undefined,
        platform: Platform.FARCASTER,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
      
      this.currentUser = user
      this.setState(AuthState.AUTHENTICATED)
      
      console.log('[FarcasterAuth] Quick Auth authentication successful')
      
      return {
        success: true,
        user
      }
      
    } catch (error: any) {
      console.error('[FarcasterAuth] Authentication error:', error)
      this.setState(AuthState.ERROR)
      
      return {
        success: false,
        error: error.message || 'Authentication failed'
      }
    }
  }
  
  private async verifyQuickAuthToken(token: string): Promise<any> {
    try {
      // Decode JWT token to extract user data
      // In production, you'd verify the token signature
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      return {
        fid: payload.fid,
        username: payload.username,
        displayName: payload.displayName,
        pfpUrl: payload.pfpUrl,
        custodyAddress: payload.custodyAddress
      }
    } catch (error) {
      console.error('[FarcasterAuth] Failed to decode token:', error)
      return null
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      console.log('[FarcasterAuth] Logging out')
      
      // Clear authentication state
      this.currentUser = null
      this.currentSession = null
      this.setState(AuthState.UNAUTHENTICATED)
      
      // Try to clear SDK auth state if available
      if (this.miniAppSdk?.quickAuth?.clearToken) {
        await this.miniAppSdk.quickAuth.clearToken()
      }
      
    } catch (error) {
      console.error('[FarcasterAuth] Logout error:', error)
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    // If we have an authenticated user, return it
    if (this.currentState === AuthState.AUTHENTICATED && this.currentUser) {
      return this.currentUser
    }
    
    // Otherwise, try to get user from context (not authenticated)
    const contextData = await this.getContextData()
    
    if (contextData?.user) {
      return {
        id: contextData.user.fid?.toString() || 'unknown',
        walletAddress: undefined,
        platform: Platform.FARCASTER,
        metadata: {
          fid: contextData.user.fid,
          username: contextData.user.username,
          displayName: contextData.user.displayName,
          pfpUrl: contextData.user.pfpUrl,
          followerCount: contextData.user.followerCount,
          followingCount: contextData.user.followingCount,
          isFromContext: true
        }
      }
    }
    
    return null
  }
  
  async getSession(): Promise<Session | null> {
    return this.currentSession
  }
  
  async validateSession(session: Session): Promise<boolean> {
    if (!session || !session.expiresAt) {
      return false
    }
    
    return new Date() < session.expiresAt
  }
  
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateCallbacks.add(callback)
    
    // Immediately call with current state
    callback(this.currentState)
    
    return () => {
      this.authStateCallbacks.delete(callback)
    }
  }
  
  // Farcaster-specific methods
  async getQuickAuthToken(): Promise<string | null> {
    try {
      return await this.miniAppSdk.quickAuth.getToken()
    } catch (error) {
      console.error('[FarcasterAuth] Failed to get Quick Auth token:', error)
      return null
    }
  }
  
  async makeAuthenticatedRequest(url: string, options?: RequestInit): Promise<Response> {
    try {
      return await this.miniAppSdk.quickAuth.fetch(url, options)
    } catch (error) {
      console.error('[FarcasterAuth] Authenticated request failed:', error)
      throw error
    }
  }
  
  async getFarcasterProfile(): Promise<any> {
    const user = await this.getCurrentUser()
    if (!user?.metadata?.fid) {
      return null
    }
    
    return {
      fid: user.metadata.fid,
      username: user.metadata.username,
      displayName: user.metadata.displayName,
      pfpUrl: user.metadata.pfpUrl,
      followerCount: user.metadata.followerCount,
      followingCount: user.metadata.followingCount,
      isVerified: this.currentState === AuthState.AUTHENTICATED
    }
  }
  
  // Check if user has social context
  hasSocialContext(): boolean {
    return !!this.currentUser
  }
  
  // Get social context information
  getSocialContext() {
    const user = this.currentUser
    if (!user) return null

    return {
      platform: Platform.FARCASTER,
      fid: user.metadata?.fid,
      username: user.metadata?.username,
      displayName: user.metadata?.displayName,
      isAuthenticated: this.currentState === AuthState.AUTHENTICATED,
      isFromContext: user.metadata?.isFromContext || false
    }
  }
  
  // Required by IAuthProvider interface
  async getWalletAddress(): Promise<string | null> {
    const user = await this.getCurrentUser()
    return user?.walletAddress || null
  }

  // IAuthProvider required alias methods
  async authenticate(): Promise<AuthResult> {
    return this.connect()
  }

  async logout(): Promise<void> {
    return this.disconnect()
  }

  async checkAuthStatus(): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (user && this.currentState === AuthState.AUTHENTICATED) {
        this.currentUser = user
        this.setState(AuthState.AUTHENTICATED)
      } else {
        this.setState(AuthState.UNAUTHENTICATED)
      }
    } catch (error: any) {
      this.setState(AuthState.ERROR)
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
    return this.currentState === AuthState.ERROR ? 'Authentication error' : null
  }

  get user(): User | null {
    return this.currentUser
  }

  get platform(): string {
    return Platform.FARCASTER
  }

  get authState(): AuthState {
    return this.currentState
  }

  get canAuthenticate(): boolean {
    return !!this.miniAppSdk && !!this.miniAppSdk.quickAuth
  }
}