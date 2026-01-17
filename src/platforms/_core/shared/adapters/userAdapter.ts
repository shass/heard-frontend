/**
 * User type adapter between Platform User and Backend User
 *
 * Platform User (from IAuthProvider.ts):
 * - walletAddress is optional
 * - metadata can hold BackendUser
 *
 * Backend User (from lib/types):
 * - walletAddress is required
 * - No metadata field
 */

import { User as PlatformUser } from '../interfaces/IAuthProvider'
import { User as BackendUser } from '@/lib/types'

/**
 * Convert Backend User to Platform User
 * Used when receiving user data from backend API
 */
export function toPlatformUser(backendUser: BackendUser, platform: string): PlatformUser {
  return {
    id: backendUser.id,
    walletAddress: backendUser.walletAddress,
    platform,
    role: backendUser.role,
    metadata: backendUser, // Store full backend user in metadata
  }
}

/**
 * Convert Platform User to Backend User
 * Used when sending user data to backend or storing in Zustand
 *
 * Note: This may fail if Platform User doesn't have walletAddress
 */
export function toBackendUser(platformUser: PlatformUser): BackendUser {
  // If metadata contains BackendUser, use it
  if (platformUser.metadata && 'heardPointsBalance' in platformUser.metadata) {
    return platformUser.metadata as BackendUser
  }

  // Otherwise construct from available fields
  return {
    id: platformUser.id,
    walletAddress: platformUser.walletAddress || '', // Required field
    role: platformUser.role || 'respondent',
    heardPointsBalance: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    platform: platformUser.platform,
  }
}
