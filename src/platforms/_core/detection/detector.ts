import { Platform, FARCASTER_CLIENT_FID } from '../../config'

export interface MiniKitContext {
  context?: {
    client?: {
      clientFid?: string
      name?: string
    }
    user?: {
      fid?: number
      username?: string
    }
  }
}

export class PlatformDetector {
  private static instance: PlatformDetector
  private detectedPlatform: Platform | null = null

  private constructor() {}

  static getInstance(): PlatformDetector {
    if (!this.instance) {
      this.instance = new PlatformDetector()
    }
    return this.instance
  }

  /**
   * Detect the current platform
   * @param miniKitContext - MiniKit context from useMiniKit hook (if available)
   */
  detect(miniKitContext?: MiniKitContext): Platform {
    console.log('[PlatformDetector] 🔍 Starting detection with context:', miniKitContext ? 'provided' : 'none')

    // Don't cache if we have new context - need to re-detect
    if (!miniKitContext && this.detectedPlatform) {
      console.log('[PlatformDetector] Using cached platform:', this.detectedPlatform)
      return this.detectedPlatform
    }

    // Server-side rendering check
    if (typeof window === 'undefined') {
      console.log('[PlatformDetector] SSR detected')
      return Platform.UNKNOWN
    }

    // Base App detection (requires MiniKit + clientFid check)
    if (this.isBaseApp(miniKitContext)) {
      this.detectedPlatform = Platform.BASE_APP
      console.log('[PlatformDetector] ✅ Detected: Base App')
      return Platform.BASE_APP
    }

    // Farcaster Mini App detection
    if (this.isFarcasterMiniApp(miniKitContext)) {
      this.detectedPlatform = Platform.FARCASTER
      console.log('[PlatformDetector] Detected: Farcaster Mini App')
      return Platform.FARCASTER
    }

    // Farcaster Frame detection (legacy/fallback)
    if (this.isFarcasterFrame()) {
      this.detectedPlatform = Platform.FARCASTER
      console.log('[PlatformDetector] Detected: Farcaster Frame')
      return Platform.FARCASTER
    }

    // Telegram WebApp detection
    if (this.isTelegramWebApp()) {
      this.detectedPlatform = Platform.TELEGRAM
      console.log('[PlatformDetector] Detected: Telegram')
      return Platform.TELEGRAM
    }

    // Default to web
    this.detectedPlatform = Platform.WEB
    console.log('[PlatformDetector] ⚠️ Defaulting to: Web (no other platform matched)')
    return Platform.WEB
  }

  /**
   * Check if running in Base App
   * According to Base documentation: clientFid === '309857'
   */
  private isBaseApp(miniKitContext?: MiniKitContext): boolean {
    // First check if MiniKit APIs exist
    const hasMiniKit = this.hasMiniKitAPIs()
    console.log('[PlatformDetector] isBaseApp check:', {
      hasMiniKit,
      hasContext: !!miniKitContext,
      clientFid: miniKitContext?.context?.client?.clientFid,
      contextKeys: miniKitContext ? Object.keys(miniKitContext) : []
    })

    if (!hasMiniKit) return false

    // Then check clientFid to distinguish Base App from Farcaster
    const clientFid = miniKitContext?.context?.client?.clientFid
    const clientFidStr = String(clientFid ?? '')

    console.log('[PlatformDetector] Base App check:', {
      hasMiniKit,
      clientFid,
      isBaseApp: clientFidStr === FARCASTER_CLIENT_FID.BASE_APP
    })

    return clientFidStr === FARCASTER_CLIENT_FID.BASE_APP
  }

  /**
   * Check if running in Farcaster Mini App
   * According to Base documentation: clientFid === '1'
   */
  private isFarcasterMiniApp(miniKitContext?: MiniKitContext): boolean {
    // First check if MiniKit APIs exist
    const hasMiniKit = this.hasMiniKitAPIs()
    if (!hasMiniKit) return false

    // Then check clientFid
    const clientFid = miniKitContext?.context?.client?.clientFid
    const clientFidStr = String(clientFid ?? '')

    console.log('[PlatformDetector] Farcaster check:', {
      hasMiniKit,
      clientFid,
      isFarcaster: clientFidStr === FARCASTER_CLIENT_FID.FARCASTER
    })

    return clientFidStr === FARCASTER_CLIENT_FID.FARCASTER
  }

  /**
   * Check if MiniKit APIs are available
   * This applies to both Base App and Farcaster
   */
  private hasMiniKitAPIs(): boolean {
    return !!(
      (window as any)?.webkit?.messageHandlers?.minikit ||
      (window as any)?.MiniKit ||
      (typeof document !== 'undefined' && document.referrer.includes('coinbase.com'))
    )
  }

  /**
   * Legacy Farcaster Frame detection (fallback)
   * Used when MiniKit context is not available
   */
  private isFarcasterFrame(): boolean {
    // Check if running in iframe with Farcaster parent
    if (window.parent === window) {
      return false
    }

    // Check for Farcaster-specific meta tags
    const metaTag = document.querySelector('meta[name="fc:frame"]')
    if (metaTag) {
      return true
    }

    // Check referrer
    try {
      const referrer = document.referrer
      return referrer.includes('warpcast.com') ||
             referrer.includes('farcaster.xyz')
    } catch {
      return false
    }
  }
  
  private isTelegramWebApp(): boolean {
    return !!(window as any)?.Telegram?.WebApp
  }
  
  // Utility methods
  reset(): void {
    this.detectedPlatform = null
  }
  
  getPlatformInfo(miniKitContext?: MiniKitContext): {
    platform: Platform
    clientFid?: string
    clientName?: string
    userAgent: string
    screen: { width: number; height: number }
    features: string[]
  } {
    const platform = this.detect(miniKitContext)

    return {
      platform,
      clientFid: miniKitContext?.context?.client?.clientFid,
      clientName: miniKitContext?.context?.client?.name,
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      features: this.detectFeatures()
    }
  }
  
  private detectFeatures(): string[] {
    const features: string[] = []
    
    // Check various APIs
    if ('geolocation' in navigator) features.push('geolocation')
    if ('bluetooth' in navigator) features.push('bluetooth')
    if ('clipboard' in navigator) features.push('clipboard')
    if ('share' in navigator) features.push('share')
    if ('vibrate' in navigator) features.push('vibrate')
    
    return features
  }
}