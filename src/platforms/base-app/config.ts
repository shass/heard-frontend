import { ITokenStorage } from '@/lib/api/token-storage'
import { LocalStorageTokenStorage } from '@/lib/api/token-storage/LocalStorageTokenStorage'

/**
 * Base App platform configuration
 * Exports platform-specific dependencies and settings
 */

/**
 * Create token storage for Base App
 * Base App uses localStorage because HttpOnly cookies may not be available in mini-app environment
 */
export function createTokenStorage(): ITokenStorage {
  return new LocalStorageTokenStorage()
}
