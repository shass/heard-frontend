import { IPlatformProvider } from '../_core/shared/interfaces/IPlatformProvider'
import { IAuthProvider } from '../_core/shared/interfaces/IAuthProvider'
import { IWalletProvider } from '../_core/shared/interfaces/IWalletProvider'
import { WebAuthProvider } from './providers/WebAuthProvider'
import { WebWalletProvider } from './providers/WebWalletProvider'

export class WebPlatformProvider implements IPlatformProvider {
  private authProvider: IAuthProvider | null = null
  private walletProvider: IWalletProvider | null = null
  
  async initialize(): Promise<void> {
    console.log('Initializing Web Platform')
    
    // Web platform initialization will happen when wagmi hooks are available
    // This is because we need React hooks context to create providers
  }
  
  async shutdown(): Promise<void> {
    console.log('Shutting down Web Platform')
    
    if (this.authProvider) {
      await this.authProvider.disconnect()
    }
    
    if (this.walletProvider) {
      await this.walletProvider.disconnect()
    }
    
    this.authProvider = null
    this.walletProvider = null
  }
  
  getPlatformName(): string {
    return 'Web Browser'
  }
  
  getPlatformVersion(): string {
    if (typeof navigator === 'undefined') {
      return 'Unknown'
    }
    
    // Extract browser info from user agent
    const ua = navigator.userAgent
    let browserInfo = 'Unknown Browser'
    
    if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      browserInfo = `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1] || ''}`
    } else if (ua.includes('Firefox/')) {
      browserInfo = `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1] || ''}`
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      browserInfo = `Safari ${ua.match(/Version\/(\d+\.\d+)/)?.[1] || ''}`
    } else if (ua.includes('Edg/')) {
      browserInfo = `Edge ${ua.match(/Edg\/(\d+)/)?.[1] || ''}`
    }
    
    return browserInfo
  }
  
  isSupported(): boolean {
    // Check for required Web APIs and Web3 capabilities
    return typeof window !== 'undefined' && 
           typeof navigator !== 'undefined' &&
           ('ethereum' in window || 'web3' in window)
  }
  
  hasFeature(feature: string): boolean {
    const features = this.getFeatures()
    return features.includes(feature)
  }
  
  getFeatures(): string[] {
    const features: string[] = []
    
    if (typeof window === 'undefined') {
      return features
    }
    
    // Core web features
    features.push('wallet', 'storage')
    
    // Check for advanced features
    if ('Notification' in window) features.push('notifications')
    if ('navigator' in window && 'share' in navigator) features.push('sharing')
    if ('geolocation' in navigator) features.push('geolocation')
    if ('clipboard' in navigator) features.push('clipboard')
    if ('serviceWorker' in navigator) features.push('offline')
    if ('localStorage' in window) features.push('localStorage')
    if ('sessionStorage' in window) features.push('sessionStorage')
    if ('indexedDB' in window) features.push('indexedDB')
    
    return features
  }
  
  // Platform-specific methods for Web
  initializeWithWagmiHooks(wagmiHooks: any): void {
    // This method should be called from a React component that has access to wagmi hooks
    if (!this.authProvider && wagmiHooks.account && wagmiHooks.signMessage) {
      this.authProvider = new WebAuthProvider(
        wagmiHooks.account,
        wagmiHooks.signMessage.signMessageAsync
      )
    }
    
    if (!this.walletProvider) {
      this.walletProvider = new WebWalletProvider(wagmiHooks)
    }
  }
  
  getAuthProvider(): IAuthProvider | null {
    return this.authProvider
  }
  
  getWalletProvider(): IWalletProvider | null {
    return this.walletProvider
  }
  
  // Web-specific feature detection
  canUseWebPush(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }
  
  canUseWebShare(): boolean {
    return 'navigator' in window && 'share' in navigator
  }
  
  canUseWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch {
      return false
    }
  }
  
  getBrowserCapabilities() {
    return {
      webPush: this.canUseWebPush(),
      webShare: this.canUseWebShare(),
      webGL: this.canUseWebGL(),
      touchSupport: 'ontouchstart' in window,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }
}