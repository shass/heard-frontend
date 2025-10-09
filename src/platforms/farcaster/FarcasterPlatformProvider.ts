import { IPlatformProvider } from '../shared/interfaces/IPlatformProvider'
import { IAuthProvider } from '../shared/interfaces/IAuthProvider'
import { IWalletProvider } from '../shared/interfaces/IWalletProvider'
import { FarcasterAuthProvider } from './providers/FarcasterAuthProvider'
import { FarcasterWalletProvider } from './providers/FarcasterWalletProvider'

export class FarcasterPlatformProvider implements IPlatformProvider {
  private authProvider: IAuthProvider | null = null
  private walletProvider: IWalletProvider | null = null
  private miniAppSdk: any = null
  private isInitialized: boolean = false

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Farcaster] Already initialized')
      return
    }

    console.log('[Farcaster] Initializing Farcaster Mini App Platform')

    // Initialize Farcaster Mini App SDK
    try {
      // Dynamic import to avoid SSR issues
      const { sdk } = await import('@farcaster/miniapp-sdk')
      this.miniAppSdk = sdk

      // CRITICAL: Signal that the frame is ready
      // According to Base documentation: "Always call setFrameReady() after initial app loading"
      await sdk.actions.ready()
      console.log('[Farcaster] ✅ Frame ready signal sent')

      // Create platform providers with SDK
      this.authProvider = new FarcasterAuthProvider(sdk)
      this.walletProvider = new FarcasterWalletProvider(sdk)

      this.isInitialized = true
      console.log('[Farcaster] ✅ Platform initialized successfully')
    } catch (error) {
      console.error('[Farcaster] ❌ Failed to initialize:', error)
      // Don't throw - allow graceful degradation
      console.warn('[Farcaster] Continuing without MiniKit SDK')
    }
  }
  
  async shutdown(): Promise<void> {
    console.log('[Farcaster] Shutting down Farcaster Mini App Platform')

    if (this.authProvider) {
      await this.authProvider.disconnect()
    }

    if (this.walletProvider) {
      await this.walletProvider.disconnect()
    }

    this.authProvider = null
    this.walletProvider = null
    this.miniAppSdk = null
    this.isInitialized = false
  }
  
  getPlatformName(): string {
    return 'Farcaster Mini App'
  }
  
  getPlatformVersion(): string {
    try {
      // Try to get SDK version if available
      return this.miniAppSdk?.version || 'Mini App v2'
    } catch {
      return 'Mini App v2'
    }
  }
  
  isSupported(): boolean {
    // Check if we're in a Farcaster Mini App environment
    if (typeof window === 'undefined') return false
    
    // Multiple detection methods for Mini App environment
    return !!(
      // Check for Mini App context
      (window as any)?.parent !== window ||
      // Check for Farcaster Mini App specific globals
      (window as any)?.farcasterMiniApp ||
      // Check for SDK context
      (window as any)?.miniAppContext ||
      // Check referrer patterns
      (typeof document !== 'undefined' && 
        (document.referrer.includes('warpcast.com') || 
         document.referrer.includes('supercast.xyz') ||
         document.referrer.includes('farcaster.xyz')))
    )
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
    
    // Core Mini App features
    features.push('mini-app', 'social-context', 'notifications')
    
    // Authentication features
    features.push('quick-auth', 'farcaster-auth', 'context-auth')
    
    // Wallet features
    features.push('ethereum-wallet', 'transaction-batching', 'eip-1193')
    
    // Social features specific to Farcaster
    features.push('cast-actions', 'frame-actions', 'social-graph')
    
    // Mini App specific constraints
    features.push('mobile-first', 'limited-storage', 'sandboxed')
    
    // Advanced features
    if (this.canUseBatchTransactions()) {
      features.push('batch-transactions', 'eip-5792')
    }
    
    return features
  }
  
  // Platform-specific methods for Farcaster Mini Apps
  getAuthProvider(): IAuthProvider | null {
    return this.authProvider
  }
  
  getWalletProvider(): IWalletProvider | null {
    return this.walletProvider
  }
  
  // Farcaster Mini App specific capabilities
  canUseBatchTransactions(): boolean {
    return true // Mini Apps support EIP-5792 batch transactions
  }
  
  canSendNotifications(): boolean {
    return this.hasFeature('notifications')
  }
  
  canAccessSocialGraph(): boolean {
    return this.hasFeature('social-graph')
  }
  
  getMiniAppCapabilities() {
    return {
      quickAuth: this.hasFeature('quick-auth'),
      batchTransactions: this.canUseBatchTransactions(),
      notifications: this.canSendNotifications(),
      socialGraph: this.canAccessSocialGraph(),
      mobileOptimized: true,
      sandboxed: true,
      limitedStorage: true,
      socialContext: true
    }
  }
  
  // Environment detection
  isInMiniApp(): boolean {
    return this.isSupported() && !!this.miniAppSdk
  }
  
  isInFarcasterClient(): boolean {
    return this.isSupported() && typeof document !== 'undefined' && 
           (document.referrer.includes('warpcast.com') || 
            document.referrer.includes('supercast.xyz'))
  }
  
  getEnvironmentInfo() {
    return {
      isMiniApp: this.isInMiniApp(),
      isFarcasterClient: this.isInFarcasterClient(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
      hasMiniAppSdk: !!this.miniAppSdk,
      isInitialized: this.isInitialized,
      features: this.getFeatures(),
      capabilities: this.getMiniAppCapabilities()
    }
  }
  
  // SDK access for advanced usage
  getMiniAppSdk() {
    return this.miniAppSdk
  }
}