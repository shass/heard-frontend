import { IAuthProvider } from './IAuthProvider'
import { IWalletProvider } from './IWalletProvider'

export interface IPlatformProvider {
  // Core lifecycle
  initialize(): Promise<void>
  shutdown(): Promise<void>
  
  // Platform info
  getPlatformName(): string
  getPlatformVersion(): string
  isSupported(): boolean
  
  // Feature detection
  hasFeature(feature: string): boolean
  getFeatures(): string[]
  
  // Provider access
  getAuthProvider(): IAuthProvider | null
  getWalletProvider(): IWalletProvider | null
}