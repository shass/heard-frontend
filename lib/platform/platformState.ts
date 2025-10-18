import { Platform } from '@/src/platforms/config'

/**
 * Global platform state - can be used outside React components
 * Set by PlatformDetectorProvider on initialization
 */
class PlatformState {
  private platform: Platform = Platform.WEB

  setPlatform(platform: Platform): void {
    this.platform = platform
  }

  getPlatform(): Platform {
    return this.platform
  }

  isBaseApp(): boolean {
    return this.platform === Platform.BASE_APP
  }

  isFarcaster(): boolean {
    return this.platform === Platform.FARCASTER
  }

  isWeb(): boolean {
    return this.platform === Platform.WEB
  }
}

// Singleton instance
export const platformState = new PlatformState()
