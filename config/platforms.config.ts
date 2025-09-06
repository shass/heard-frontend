export const PLATFORM_DETECTION = {
  checks: {
    base: [
      { type: 'userAgent', patterns: [/Base/i, /Warpcast/i] },
      { type: 'hostname', patterns: ['base.org', 'warpcast.com'] },
      { type: 'windowProperty', property: 'miniKit' }
    ],
    farcaster: [
      { type: 'userAgent', patterns: [/Farcaster/i] },
      { type: 'hostname', patterns: ['farcaster.xyz'] },
      { type: 'searchParam', param: 'farcaster-frame' }
    ]
  },
  priority: {
    base: 1,
    farcaster: 2,
    web: 999
  }
} as const

export const PLATFORM_UI = {
  touchTarget: {
    minimum: 44,
    recommended: 48
  },
  safeAreas: {
    base: { top: 44, bottom: 34 },
    farcaster: { top: 40, bottom: 0 },
    web: { top: 0, bottom: 0 }
  },
  colorSchemes: {
    base: 'light',
    farcaster: 'dark', 
    web: 'auto'
  }
} as const

export const PLATFORM_CAPABILITIES = {
  web: {
    hasNativeAuth: false,
    preferredAuth: 'wallet',
    hasWeb3: true,
    hasSocialShare: true,
    hasHeader: true,
    hasFooter: true,
    canOpenExternal: true
  },
  base: {
    hasNativeAuth: true,
    preferredAuth: 'base',
    hasWeb3: true, 
    hasSocialShare: true,
    hasHeader: false,
    hasFooter: false,
    canOpenExternal: true
  },
  farcaster: {
    hasNativeAuth: true,
    preferredAuth: 'farcaster',
    hasWeb3: true,
    hasSocialShare: true, 
    hasHeader: false,
    hasFooter: false,
    canOpenExternal: true
  }
} as const

export type PlatformType = keyof typeof PLATFORM_CAPABILITIES