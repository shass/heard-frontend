export interface IAuthProvider {
  // Authentication
  connect(): Promise<AuthResult>
  disconnect(): Promise<void>
  authenticate(): Promise<AuthResult>
  logout(): Promise<void>
  getSession(): Promise<Session | null>
  
  // User info
  getCurrentUser(): Promise<User | null>
  getWalletAddress(): Promise<string | null>
  
  // State
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: User | null
  platform?: string
  authState: AuthState
  canAuthenticate: boolean
  
  // Auth status
  checkAuthStatus(): Promise<void>
  
  // Events
  onAuthStateChange(callback: (state: AuthState) => void): () => void
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export interface Session {
  id: string
  userId: string
  walletAddress?: string
  platform: string
  expiresAt: Date
}

export interface User {
  id: string
  walletAddress?: string
  platform: string
  metadata?: Record<string, any>
}

export enum AuthState {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  LOADING = 'loading',
  ERROR = 'error'
}