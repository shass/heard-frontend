import { ITokenStorage } from './ITokenStorage'

/**
 * No-operation token storage for Web platform
 *
 * Web platform uses HttpOnly cookies for authentication, which are:
 * - Automatically sent with every request by the browser
 * - Not accessible from JavaScript (more secure)
 * - Managed entirely by the backend
 *
 * Therefore, this storage implementation does nothing on the client side.
 * All token management happens through cookies set by the backend.
 */
export class NoOpTokenStorage implements ITokenStorage {
  getToken(): string | null {
    // Web platform doesn't store tokens client-side
    // Authentication is handled via HttpOnly cookies
    return null
  }

  setToken(_token: string | null): void {
    // No-op: HttpOnly cookies are set by backend
    // Nothing to do on client side
  }

  clearToken(): void {
    // No-op: HttpOnly cookies are cleared by backend via /auth/disconnect
    // Nothing to do on client side
  }
}
