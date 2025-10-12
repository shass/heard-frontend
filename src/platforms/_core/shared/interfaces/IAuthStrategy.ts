import { AuthState, User } from './IAuthProvider'

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export interface IAuthStrategy {
  // State
  user: User | null
  authState: AuthState
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Core methods
  authenticate: () => Promise<AuthResult>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>

  // Capabilities
  canAuthenticate: boolean
}
