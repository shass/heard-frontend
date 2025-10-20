/**
 * Token Storage Strategy Interface
 *
 * Defines contract for platform-specific token storage mechanisms.
 * - Web platform: uses HttpOnly cookies (no client-side storage)
 * - Base App platform: uses localStorage with JWT tokens
 * - Farcaster platform: can use SDK-specific storage
 */
export interface ITokenStorage {
  /**
   * Get authentication token from storage
   * @returns Token string or null if not found
   */
  getToken(): string | null

  /**
   * Store authentication token
   * @param token - JWT token to store, or null to clear
   */
  setToken(token: string | null): void

  /**
   * Clear authentication token from storage
   */
  clearToken(): void
}
