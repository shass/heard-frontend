import { BaseDetector } from './detectors/base.detector'
import { FarcasterDetector } from './detectors/farcaster.detector'  
import { WebDetector } from './detectors/web.detector'
import { PLATFORM_DETECTION, PLATFORM_CAPABILITIES } from '@/config/platforms.config'
import type { Platform, PlatformDetector } from './types'

export class PlatformManager {
  private static instance: PlatformManager
  private detectors: PlatformDetector[]
  private cachedPlatform: Platform | null = null
  
  private constructor() {
    this.detectors = [
      new BaseDetector(),
      new FarcasterDetector(),
      new WebDetector()
    ].sort((a, b) => 
      PLATFORM_DETECTION.priority[a.type] - PLATFORM_DETECTION.priority[b.type]
    )
  }
  
  static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager()
    }
    return PlatformManager.instance
  }
  
  detect(forceRefresh = false): Platform {
    if (typeof window === 'undefined') {
      return this.getWebPlatform()
    }
    
    if (this.cachedPlatform && !forceRefresh) {
      return this.cachedPlatform
    }
    
    for (const detector of this.detectors) {
      if (detector.matches()) {
        this.cachedPlatform = {
          type: detector.type,
          name: `${detector.type} Platform`,
          capabilities: detector.getCapabilities(),
          ui: detector.getUIConfig()
        }
        
        this.setDataAttribute(detector.type)
        console.log(`[Platform] Detected: ${detector.type}`)
        return this.cachedPlatform
      }
    }
    
    return this.getWebPlatform()
  }
  
  private getWebPlatform(): Platform {
    return {
      type: 'web',
      name: 'Web Browser',
      capabilities: PLATFORM_CAPABILITIES.web,
      ui: {
        safeAreaTop: 0,
        safeAreaBottom: 0, 
        touchTargetSize: 44,
        preferredColorScheme: 'auto'
      }
    }
  }
  
  private setDataAttribute(platformType: string) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-platform', platformType)
    }
  }
}