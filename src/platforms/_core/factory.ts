import { Platform } from '../config'
import { IPlatformProvider } from './shared/interfaces/IPlatformProvider'
import { WebPlatformProvider } from '../web/WebPlatformProvider'
import { BaseAppPlatformProvider } from '../base-app/BaseAppPlatformProvider'
import { FarcasterPlatformProvider } from '../farcaster/FarcasterPlatformProvider'

export class PlatformFactory {
  static create(platform: Platform): IPlatformProvider {
    switch (platform) {
      case Platform.WEB:
        return new WebPlatformProvider()
      case Platform.BASE_APP:
        return new BaseAppPlatformProvider()
      case Platform.FARCASTER:
        return new FarcasterPlatformProvider()
      default:
        // Fallback to web
        console.warn(`Unknown platform: ${platform}, falling back to web`)
        return new WebPlatformProvider()
    }
  }
}