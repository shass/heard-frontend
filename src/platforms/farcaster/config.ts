import { ITokenStorage } from '@/lib/api/token-storage'
import { LocalStorageTokenStorage } from '@/lib/api/token-storage/LocalStorageTokenStorage'

/**
 * Farcaster platform configuration
 * Exports platform-specific dependencies and settings
 */

/**
 * Create token storage for Farcaster
 * Farcaster uses localStorage for token persistence in mini-app environment
 */
export function createTokenStorage(): ITokenStorage {
  return new LocalStorageTokenStorage()
}
