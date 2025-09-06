import { PLATFORM_UI, PLATFORM_CAPABILITIES } from '@/config/platforms.config'
import type { PlatformDetector } from '../types'

export class WebDetector implements PlatformDetector {
  readonly type = 'web' as const
  
  matches(): boolean {
    // Web detector always matches as fallback
    return true
  }
  
  getCapabilities() {
    return PLATFORM_CAPABILITIES.web
  }
  
  getUIConfig() {
    return {
      safeAreaTop: PLATFORM_UI.safeAreas.web.top,
      safeAreaBottom: PLATFORM_UI.safeAreas.web.bottom,
      touchTargetSize: PLATFORM_UI.touchTarget.recommended,
      preferredColorScheme: PLATFORM_UI.colorSchemes.web
    }
  }
}