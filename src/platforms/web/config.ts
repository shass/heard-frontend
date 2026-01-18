import { ITokenStorage } from '@/lib/api/token-storage'
import { NoOpTokenStorage } from '@/lib/api/token-storage/NoOpTokenStorage'

/**
 * Web platform configuration
 * Exports platform-specific dependencies and settings
 */

/**
 * Create token storage for Web platform
 * Web uses HttpOnly cookies (handled by backend), so no client-side token storage needed
 */
export function createTokenStorage(): ITokenStorage {
  return new NoOpTokenStorage()
}
