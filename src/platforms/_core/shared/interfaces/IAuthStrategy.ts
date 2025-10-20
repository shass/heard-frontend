import { AuthState, User, AuthResult } from './IAuthProvider'

// Re-export types needed by strategy consumers
export type { AuthResult, AuthState, User }

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
