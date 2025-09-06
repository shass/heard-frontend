import { PLATFORM_DETECTION, PLATFORM_UI, PLATFORM_CAPABILITIES } from '@/config/platforms.config'
import type { PlatformDetector } from '../types'

export class BaseDetector implements PlatformDetector {
  readonly type = 'base' as const
  
  matches(): boolean {
    if (typeof window === 'undefined') return false
    
    const checks = PLATFORM_DETECTION.checks.base
    
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
          
        case 'windowProperty':
          if (check.property && check.property in window) {
            return true
          }
          break
      }
    }
    
    return false
  }
  
  getCapabilities() {
    return PLATFORM_CAPABILITIES.base
  }
  
  getUIConfig() {
    return {
      safeAreaTop: PLATFORM_UI.safeAreas.base.top,
      safeAreaBottom: PLATFORM_UI.safeAreas.base.bottom,
      touchTargetSize: PLATFORM_UI.touchTarget.minimum,
      preferredColorScheme: PLATFORM_UI.colorSchemes.base
    }
  }
}