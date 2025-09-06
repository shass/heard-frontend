export type PlatformType = 'web' | 'base' | 'farcaster'

export interface DetectionCheck {
  type: 'userAgent' | 'hostname' | 'windowProperty' | 'searchParam'
  patterns?: (string | RegExp)[]
  property?: string
  param?: string
}

export interface Platform {
  type: PlatformType
  name: string
  capabilities: PlatformCapabilities
  ui: UIConfig
}

export interface PlatformCapabilities {
  hasNativeAuth: boolean
  preferredAuth: string
  hasWeb3: boolean
  hasSocialShare: boolean
  hasHeader: boolean
  hasFooter: boolean
  canOpenExternal: boolean
}

export interface UIConfig {
  safeAreaTop: number
  safeAreaBottom: number
  touchTargetSize: number
  preferredColorScheme: string
}

export interface PlatformDetector {
  readonly type: PlatformType
  matches(): boolean
  getCapabilities(): PlatformCapabilities
  getUIConfig(): UIConfig
}