import { IAuthStrategy } from '../interfaces/IAuthStrategy'
import type { AuthResult } from '../interfaces/IAuthProvider'

/**
 * Safe no-op fallback returned by useAuth() when the real strategy
 * is not yet available (platform loading, error, missing context).
 * Prevents runtime TypeErrors from calling methods on null.
 */
export class NoOpAuthStrategy implements IAuthStrategy {
  readonly canAuthenticate = false

  async authenticate(): Promise<AuthResult> {
    return { success: false, error: 'Auth not ready' }
  }

  async logout(): Promise<void> {}

  async checkAuthStatus(): Promise<void> {}
}

/** Module-level singleton — no need to recreate on every render */
export const noOpAuthStrategy = new NoOpAuthStrategy()
