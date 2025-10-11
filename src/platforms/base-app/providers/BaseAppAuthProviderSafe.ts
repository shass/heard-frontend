import {
  IAuthProvider,
  AuthResult,
  Session,
  User,
  AuthState
} from '../_core/shared/interfaces/IAuthProvider'
import { Platform, platformToApiValue } from '../../config'

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
      clientFid?: string
      name?: string
    }
  }
}

interface AuthenticateHook {
  signIn?: (params: {
    domain: string
    siweUri: string
    nonce?: string // Optional nonce for SIWE message (at least 8 alphanumeric chars)
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
    console.log('[BaseAppAuth] 🚀 Connect called')
    console.log('[BaseAppAuth] isAvailable:', this.isAvailable)
    console.log('[BaseAppAuth] MiniKit context:', this.miniKitContext?.context)
    console.log('[BaseAppAuth] Authenticate hook available:', !!this.authenticateHook)

    // Правильное определение клиента согласно документации Base
    const clientFid = this.miniKitContext?.context?.client?.clientFid
    const isBaseApp = clientFid === '309857'
    const isFarcaster = clientFid === '1'

    console.log('[BaseAppAuth] 🔍 Client detection:', {
      clientFid,
      isBaseApp,
      isFarcaster,
      clientName: this.miniKitContext?.context?.client?.name
    })

    if (!this.isAvailable) {
      const error = 'MiniKit not available - cannot authenticate'
      console.error('[BaseAppAuth] ❌ MiniKit not available')
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

      console.log('[BaseAppAuth] 🔄 Starting MiniKit authentication')

      // Check if signIn method exists
      if (!this.authenticateHook?.signIn) {
        console.error('[BaseAppAuth] ❌ signIn method not available on authenticateHook')
        console.log('[BaseAppAuth] authenticateHook object:', this.authenticateHook)
        throw new Error('Authentication hook signIn method not available')
      }

      // First, get wallet address from MiniKit context
      const walletAddress = this.miniKitContext?.context?.user?.custody?.address
      console.log('[BaseAppAuth] 📍 Looking for wallet address...')
      console.log('[BaseAppAuth] Context user:', this.miniKitContext?.context?.user)
      console.log('[BaseAppAuth] Custody:', this.miniKitContext?.context?.user?.custody)

      if (!walletAddress) {
        console.error('[BaseAppAuth] ❌ No wallet address in context')
        throw new Error('No wallet address available in MiniKit context')
      }

      console.log('[BaseAppAuth] ✅ Got wallet address:', walletAddress)

      // Import auth API dynamically to avoid SSR issues
      console.log('[BaseAppAuth] 📦 Importing auth API...')
      const { authApi } = await import('@/lib/api/auth')

      // Step 1: Get nonce from backend
      console.log('[BaseAppAuth] 🔐 Step 1: Getting nonce from backend...')
      let nonceResponse
      try {
        nonceResponse = await authApi.getNonce(walletAddress)
        console.log('[BaseAppAuth] ✅ Nonce received:', {
          nonce: nonceResponse.nonce,
          jwtToken: nonceResponse.jwtToken?.substring(0, 20) + '...'
        })
      } catch (nonceError: any) {
        console.error('[BaseAppAuth] ❌ Failed to get nonce:', nonceError)
        console.error('[BaseAppAuth] Nonce error details:', {
          message: nonceError.message,
          stack: nonceError.stack,
          response: nonceError.response
        })
        throw new Error(`Failed to get nonce: ${nonceError.message}`)
      }

      const { nonce, jwtToken } = nonceResponse

      // Step 2: Use MiniKit's authenticate hook to sign the message
      console.log('[BaseAppAuth] ✍️ Step 2: Requesting signature via MiniKit...')

      // Use production domain for signature to match backend expectations
      const isDev = process.env.NODE_ENV === 'development'
      const useProdBackend = process.env.NEXT_PUBLIC_USE_PRODUCTION_BACKEND === 'true'

      console.log('[BaseAppAuth] Environment:', {
        isDev,
        useProdBackend,
        nonce: nonce.substring(0, 8) + '...'
      })

      const signInDomain = isDev && useProdBackend
        ? 'heardlabs.xyz'
        : window.location.hostname

      const signInUri = isDev && useProdBackend
        ? 'https://heardlabs.xyz'
        : window.location.origin

      console.log('[BaseAppAuth] 🌐 SIWE SignIn parameters:', {
        domain: signInDomain,
        siweUri: signInUri,
        nonce: nonce.substring(0, 8) + '...'
      })

      let authResult
      try {
        console.log('[BaseAppAuth] 📝 Calling signIn with backend nonce...')

        // CRITICAL: Pass backend nonce to signIn for SIWE message
        // According to Farcaster docs, signIn accepts nonce parameter
        authResult = await this.authenticateHook.signIn({
          domain: signInDomain,
          siweUri: signInUri,
          nonce: nonce // ← Backend nonce for verification
        })

        console.log('[BaseAppAuth] ✅ SignIn completed, result:', authResult)
      } catch (signInError: any) {
        console.error('[BaseAppAuth] ❌ SignIn failed:', signInError)
        console.error('[BaseAppAuth] SignIn error details:', {
          message: signInError.message,
          stack: signInError.stack,
          code: signInError.code
        })
        throw new Error(`MiniKit signIn failed: ${signInError.message}`)
      }

      if (!authResult) {
        console.error('[BaseAppAuth] ❌ No authResult returned from signIn')
        throw new Error('MiniKit signature failed - no result returned')
      }

      console.log('[BaseAppAuth] 🔏 Got signature from MiniKit:', {
        type: typeof authResult,
        hasSignature: !!(authResult as any).signature,
        hasMessage: !!(authResult as any).message,
        keys: Object.keys(authResult as any),
        fullResult: authResult
      })

      // MiniKit возвращает объект с SIWE данными:
      // { signature: string, message: string }
      // где message - это полное SIWE сообщение
      const siweSignature = (authResult as any).signature
      const siweMessage = (authResult as any).message

      if (!siweSignature || !siweMessage) {
        console.error('[BaseAppAuth] ❌ Invalid MiniKit response - missing signature or message')
        throw new Error('Invalid MiniKit response - missing signature or message')
      }

      console.log('[BaseAppAuth] 📋 SIWE data from MiniKit:', {
        messageLength: siweMessage.length,
        signatureLength: siweSignature.length,
        messagePreview: siweMessage.substring(0, 100) + '...'
      })

      // Step 3: Send SIWE data to backend for verification
      console.log('[BaseAppAuth] 🔄 Step 3: Verifying SIWE signature with backend...')

      const connectWalletPayload = {
        walletAddress,
        signature: siweSignature,
        message: siweMessage, // Используем SIWE сообщение от MiniKit
        jwtToken,
        platform: platformToApiValue(Platform.BASE_APP), // Convert enum to API value ('base')
        metadata: {
          fid: this.miniKitContext?.context?.user?.fid,
          username: this.miniKitContext?.context?.user?.username,
          clientFid: this.miniKitContext?.context?.client?.clientFid,
          clientName: this.miniKitContext?.context?.client?.name
        }
      }

      console.log('[BaseAppAuth] 📤 Sending SIWE to backend:', {
        walletAddress,
        signatureLength: siweSignature.length,
        messageLength: siweMessage.length,
        jwtTokenLength: jwtToken?.length
      })

      let backendResponse
      try {
        backendResponse = await authApi.connectWallet(connectWalletPayload)
        console.log('[BaseAppAuth] ✅ Backend response received:', backendResponse)
      } catch (connectError: any) {
        console.error('[BaseAppAuth] ❌ Backend verification failed:', connectError)
        console.error('[BaseAppAuth] Connect error details:', {
          message: connectError.message,
          stack: connectError.stack,
          response: connectError.response
        })
        throw new Error(`Backend verification failed: ${connectError.message}`)
      }

      const { user: backendUser } = backendResponse

      console.log('[BaseAppAuth] ✅ Backend verification successful, user:', backendUser)

      // Create user object from backend response
      const user: User = {
        id: backendUser.id || this.miniKitContext?.context?.user?.fid?.toString() || 'unknown',
        walletAddress: backendUser.walletAddress || walletAddress,
        platform: Platform.BASE_APP,
        metadata: {
          ...backendUser,
          fid: this.miniKitContext?.context?.user?.fid,
          username: this.miniKitContext?.context?.user?.username,
          displayName: this.miniKitContext?.context?.user?.displayName,
          pfpUrl: this.miniKitContext?.context?.user?.pfpUrl,
          miniKitContext: this.miniKitContext?.context
        }
      }

      this.currentUser = user
      this.currentLoading = false
      this.setState(AuthState.AUTHENTICATED)

      console.log('[BaseAppAuth] 🎉 Full authentication successful')

      return {
        success: true,
        user
      }

    } catch (error: any) {
      console.error('[BaseAppAuth] ❌ Authentication error:', error)
      console.error('[BaseAppAuth] Error stack:', error.stack)
      console.error('[BaseAppAuth] Error type:', error.constructor.name)

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
      platform: Platform.BASE_APP,
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
      platform: Platform.BASE_APP,
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
    return Platform.BASE_APP
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
        platform: Platform.BASE_APP,
        available: false
      }
    }

    return {
      clientFid: this.miniKitContext?.context?.client?.clientFid,
      clientName: this.miniKitContext?.context?.client?.name,
      platform: Platform.BASE_APP,
      available: true
    }
  }
}