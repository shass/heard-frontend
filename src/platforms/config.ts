export enum Platform {
  WEB = 'web',
  BASE_APP = 'base-app',
  FARCASTER = 'farcaster',
  TELEGRAM = 'telegram',
  UNKNOWN = 'unknown'
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