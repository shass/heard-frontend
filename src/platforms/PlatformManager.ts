import { Platform } from './config'
import { IPlatformProvider } from './shared/interfaces/IPlatformProvider'
import { PlatformDetector } from './detection/detector'
import { PlatformFactory } from './factory'

export class PlatformManager {
  private static instance: PlatformManager
  private currentProvider: IPlatformProvider | null = null
  private currentPlatform: Platform | null = null
  
  private constructor() {}
  
  static getInstance(): PlatformManager {
    if (!this.instance) {
      this.instance = new PlatformManager()
    }
    return this.instance
  }
  
  async initialize(): Promise<void> {
    // Detect current platform
    const detector = PlatformDetector.getInstance()
    this.currentPlatform = detector.detect()
    
    // Create appropriate provider
    this.currentProvider = PlatformFactory.create(this.currentPlatform)
    
    // Initialize the provider
    await this.currentProvider.initialize()
    
    console.log(`Platform initialized: ${this.currentPlatform}`)
  }
  
  async shutdown(): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.shutdown()
      this.currentProvider = null
    }
    this.currentPlatform = null
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
      supported: this.currentProvider.isSupported()
    }
  }
  
  hasFeature(feature: string): boolean {
    return this.currentProvider?.hasFeature(feature) ?? false
  }
}