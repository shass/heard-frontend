import { IPlatformProvider } from '../shared/interfaces/IPlatformProvider'
import { IAuthProvider } from '../shared/interfaces/IAuthProvider'
import { IWalletProvider } from '../shared/interfaces/IWalletProvider'
import { BaseAppAuthProviderSafe } from './providers/BaseAppAuthProviderSafe'
import { BaseAppWalletProvider } from './providers/BaseAppWalletProvider'

export class BaseAppPlatformProvider implements IPlatformProvider {
  private authProvider: IAuthProvider | null = null
  private walletProvider: IWalletProvider | null = null
  
  async initialize(): Promise<void> {
    console.log('Initializing Base App Platform')
    
    // Base App platform initialization happens when MiniKit hooks are available
    // This is because we need React hooks context to create providers
  }
  
  async shutdown(): Promise<void> {
    console.log('Shutting down Base App Platform')
    
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
    return 'Base App (MiniKit)'
  }
  
  getPlatformVersion(): string {
    // Try to get OnchainKit version if available
    try {
      // OnchainKit version detection
      return 'OnchainKit 0.38+' 
    } catch {
      return 'MiniKit 1.0.0'
    }
  }
  
  isSupported(): boolean {
    // Check if we're in a MiniKit environment
    if (typeof window === 'undefined') return false
    
    // Multiple ways to detect Base App/MiniKit environment
    return !!(
      (window as any)?.MiniKit ||
      (window as any)?.webkit?.messageHandlers?.minikit ||
      // Check for OnchainKit MiniKit context
      (typeof document !== 'undefined' && document.referrer.includes('coinbase.com'))
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
    
    // Core MiniKit features
    features.push('wallet', 'authentication', 'transactions', 'signing')
    
    // Farcaster-specific features
    features.push('farcaster-context', 'user-profile', 'custody-wallet')
    
    // Base-specific features  
    features.push('base-chain', 'gasless-transactions')
    
    // Social features available in MiniKit
    features.push('compose-cast', 'view-profile', 'view-cast')
    
    // Limited storage (different from web)
    features.push('session-storage')
    
    return features
  }
  
  // Platform-specific methods for Base App
  initializeWithMiniKitHooks(miniKitHooks: any): void {
    // This method should be called from a React component that has access to MiniKit hooks
    // Always use safe provider that handles missing hooks gracefully
    if (!this.authProvider) {
      // Use safe provider that handles all scenarios (hooks available or not)
      this.authProvider = new BaseAppAuthProviderSafe(
        miniKitHooks?.miniKit || null,
        miniKitHooks?.authenticate || null
      )
      
      if (miniKitHooks?.miniKit && miniKitHooks?.authenticate) {
        console.log('[BaseApp] MiniKit hooks available, using full functionality')
      } else {
        console.warn('[BaseApp] Some MiniKit hooks missing, using limited functionality')
      }
    }
    
    if (!this.walletProvider && miniKitHooks?.miniKit) {
      // Only create wallet provider if miniKit is available
      this.walletProvider = new BaseAppWalletProvider(
        miniKitHooks.miniKit,
        miniKitHooks?.account || null,
        miniKitHooks?.sendTransaction || null,
        miniKitHooks?.signMessage || null
      )
    }
  }
  
  getAuthProvider(): IAuthProvider | null {
    return this.authProvider
  }
  
  getWalletProvider(): IWalletProvider | null {
    return this.walletProvider
  }
  
  // Base App specific feature detection
  canUseGaslessTransactions(): boolean {
    return true // Base App supports gasless transactions
  }
  
  canComposeCast(): boolean {
    return this.hasFeature('compose-cast')
  }
  
  canViewProfile(): boolean {
    return this.hasFeature('view-profile')
  }
  
  getMiniKitCapabilities() {
    return {
      gaslessTransactions: this.canUseGaslessTransactions(),
      composeCast: this.canComposeCast(),
      viewProfile: this.canViewProfile(),
      custodyWallet: true,
      baseChain: true,
      farcasterContext: true,
      limitedStorage: true,
      noExternalNavigation: true,
      mobileOptimized: true
    }
  }
  
  // Environment checks
  isInBaseApp(): boolean {
    return this.isSupported() && !!(window as any)?.MiniKit
  }
  
  isInFarcasterContext(): boolean {
    return this.isSupported() && typeof document !== 'undefined' && 
           (document.referrer.includes('warpcast.com') || 
            document.referrer.includes('farcaster.xyz'))
  }
  
  getEnvironmentInfo() {
    return {
      isBaseApp: this.isInBaseApp(),
      isFarcasterContext: this.isInFarcasterContext(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
      hasMinKit: !!(window as any)?.MiniKit,
      features: this.getFeatures(),
      capabilities: this.getMiniKitCapabilities()
    }
  }
}