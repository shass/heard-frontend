export enum Platform {
  WEB = 'web',
  BASE_APP = 'base-app',
  FARCASTER = 'farcaster',
  TELEGRAM = 'telegram',
  UNKNOWN = 'unknown'
}

/**
 * Farcaster Client FID identifiers for platform detection
 * NOTE: clientFid is self-reported and should be considered untrusted
 * Use only for UI decisions, NOT for authorization
 */
export const FARCASTER_CLIENT_FID = {
  BASE_APP: '309857',    // Coinbase Base App
  FARCASTER: '9152',     // Warpcast (official Farcaster client)
} as const

/**
 * Maps Platform enum values to API platform identifiers
 * Used when sending platform info to backend
 */
export function platformToApiValue(platform: Platform | string | null): string {
  switch (platform) {
    case Platform.BASE_APP:
      return 'base'
    case Platform.FARCASTER:
      return 'farcaster'
    case Platform.WEB:
      return 'web'
    case Platform.TELEGRAM:
      return 'telegram'
    default:
      return 'web' // default fallback
  }
}

export interface PlatformConfig {
  name: Platform
  displayName: string
  features: {
    wallet: boolean
    notifications: boolean
    sharing: boolean
    deepLinks: boolean
    storage: 'localStorage' | 'sessionStorage' | 'custom'
  }
  constraints?: {
    maxFileSize?: number
    allowedDomains?: string[]
    requiredPermissions?: string[]
  }
}
