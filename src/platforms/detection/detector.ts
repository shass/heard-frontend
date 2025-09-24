import { Platform } from '../config'

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
  
  detect(): Platform {
    // Cache detection result
    if (this.detectedPlatform) {
      return this.detectedPlatform
    }
    
    // Server-side rendering check
    if (typeof window === 'undefined') {
      return Platform.UNKNOWN
    }
    
    // Base App detection
    if (this.isBaseApp()) {
      this.detectedPlatform = Platform.BASE_APP
      return Platform.BASE_APP
    }
    
    // Farcaster Frame detection
    if (this.isFarcasterFrame()) {
      this.detectedPlatform = Platform.FARCASTER
      return Platform.FARCASTER
    }
    
    // Telegram WebApp detection
    if (this.isTelegramWebApp()) {
      this.detectedPlatform = Platform.TELEGRAM
      return Platform.TELEGRAM
    }
    
    // Default to web
    this.detectedPlatform = Platform.WEB
    return Platform.WEB
  }
  
  private isBaseApp(): boolean {
    // Check for MiniKit specific APIs
    // NOTE: Update this based on actual Base App MiniKit documentation
    return !!(
      window as any
    )?.webkit?.messageHandlers?.minikit ||
    !!(window as any)?.MiniKit
  }
  
  private isFarcasterFrame(): boolean {
    // Check if running in iframe with Farcaster parent
    // NOTE: Update based on actual Farcaster Frames documentation
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
  
  getPlatformInfo(): {
    platform: Platform
    userAgent: string
    screen: { width: number; height: number }
    features: string[]
  } {
    const platform = this.detect()
    return {
      platform,
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