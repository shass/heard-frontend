import { PLATFORM_DETECTION, PLATFORM_UI, PLATFORM_CAPABILITIES } from '@/config/platforms.config'
import type { PlatformDetector } from '../types'

export class FarcasterDetector implements PlatformDetector {
  readonly type = 'farcaster' as const
  
  matches(): boolean {
    if (typeof window === 'undefined') return false
    
    const checks = PLATFORM_DETECTION.checks.farcaster
    
    for (const check of checks) {
      switch (check.type) {
        case 'userAgent':
          if (check.patterns?.some(pattern => pattern.test(navigator.userAgent))) {
            return true
          }
          break
          
        case 'hostname':
          if (check.patterns?.some(hostname => 
            window.location.hostname.includes(hostname)
          )) {
            return true
          }
          break
          
        case 'searchParam':
          if (check.param) {
            const params = new URLSearchParams(window.location.search)
            if (params.has(check.param)) {
              return true
            }
          }
          break
      }
    }
    
    return false
  }
  
  getCapabilities() {
    return PLATFORM_CAPABILITIES.farcaster
  }
  
  getUIConfig() {
    return {
      safeAreaTop: PLATFORM_UI.safeAreas.farcaster.top,
      safeAreaBottom: PLATFORM_UI.safeAreas.farcaster.bottom,
      touchTargetSize: PLATFORM_UI.touchTarget.minimum,
      preferredColorScheme: PLATFORM_UI.colorSchemes.farcaster
    }
  }
}