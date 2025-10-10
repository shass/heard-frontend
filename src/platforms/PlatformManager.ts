import { Platform } from './config'
import { IPlatformProvider } from './shared/interfaces/IPlatformProvider'
import { PlatformDetector, MiniKitContext } from './detection/detector'
import { PlatformFactory } from './factory'

export class PlatformManager {
  private static instance: PlatformManager
  private currentProvider: IPlatformProvider | null = null
  private currentPlatform: Platform | null = null
  private isInitialized: boolean = false

  private constructor() {}

  static getInstance(): PlatformManager {
    if (!this.instance) {
      this.instance = new PlatformManager()
    }
    return this.instance
  }

  /**
   * Initialize platform
   * @param miniKitContext - Optional MiniKit context for proper platform detection
   */
  async initialize(miniKitContext?: MiniKitContext): Promise<void> {
    console.log('[PlatformManager] 🚀 initialize() called with context:', miniKitContext ? 'provided' : 'none')

    if (this.isInitialized) {
      console.log('[PlatformManager] Already initialized, returning cached:', this.currentPlatform)
      return
    }

    try {
      // Detect current platform with context
      console.log('[PlatformManager] 🔍 Calling detector.detect()...')
      const detector = PlatformDetector.getInstance()
      this.currentPlatform = detector.detect(miniKitContext)

      console.log('[PlatformManager] ✅ Detected platform:', this.currentPlatform)

      // Create appropriate provider
      this.currentProvider = PlatformFactory.create(this.currentPlatform)

      // Initialize the provider
      await this.currentProvider.initialize()

      this.isInitialized = true
      console.log('[PlatformManager] ✅ Platform initialized:', this.currentPlatform)
    } catch (error) {
      console.error('[PlatformManager] ❌ Initialization failed:', error)
      throw error
    }
  }
  
  async shutdown(): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.shutdown()
      this.currentProvider = null
    }
    this.currentPlatform = null
    this.isInitialized = false
  }
  
  getCurrentPlatform(): Platform | null {
    return this.currentPlatform
  }
  
  getCurrentProvider(): IPlatformProvider | null {
    return this.currentProvider
  }
  
  getPlatformInfo() {
    if (!this.currentProvider || !this.currentPlatform) {
      return null
    }

    return {
      platform: this.currentPlatform,
      name: this.currentProvider.getPlatformName(),
      version: this.currentProvider.getPlatformVersion(),
      features: this.currentProvider.getFeatures(),
      supported: this.currentProvider.isSupported(),
      initialized: this.isInitialized
    }
  }

  hasFeature(feature: string): boolean {
    return this.currentProvider?.hasFeature(feature) ?? false
  }

  isReady(): boolean {
    return this.isInitialized && this.currentProvider !== null
  }
}