import { AuthResult } from './IAuthProvider'

// Re-export types needed by strategy consumers
export type { AuthResult }

export interface IAuthStrategy {
  // Core methods
  authenticate: () => Promise<AuthResult>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>

  // Capabilities
  canAuthenticate: boolean

  // Lifecycle (optional)
  destroy?: () => void
}
