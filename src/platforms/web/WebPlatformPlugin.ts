/**
 * Web Platform Plugin
 *
 * Default platform implementation for standard web browsers.
 * Uses wallet-based authentication with HttpOnly cookies for token storage.
 * Serves as the fallback platform when no specialized platform is detected.
 */

import { ComponentType } from 'react'
import { IPlatformPlugin } from '@/src/core/interfaces/IPlatformPlugin'
import {
  PlatformConfig,
  PlatformFeatures,
  PlatformConstraints,
  LayoutProps
} from '@/src/core/interfaces/types'
import { IAuthStrategy } from '@/src/platforms/_core/shared/interfaces/IAuthStrategy'
import { IWalletStrategy } from '@/src/platforms/_core/shared/interfaces/IWalletStrategy'
import { IShareStrategy } from '@/src/platforms/_core/shared/interfaces/IShareStrategy'
import { IUrlStrategy } from '@/src/platforms/_core/shared/interfaces/IUrlStrategy'
import { ITokenStorage } from '@/lib/api/token-storage'
import { NoOpTokenStorage } from '@/lib/api/token-storage/NoOpTokenStorage'
// Strategy wrappers removed - strategies now created via DI in hooks
import { WebShareStrategy } from './strategies/WebShareStrategy'
import { WebUrlStrategy } from './strategies/WebUrlStrategy'
import WebLayout from './layouts/WebLayout'
import { WebAuthSection } from './components/WebAuthSection'

const isDevelopment = process.env.NODE_ENV === 'development'

export class WebPlatformPlugin implements IPlatformPlugin {
  // ========================================
  // Identity
  // ========================================

  readonly id = 'web'
  readonly name = 'Web'
  readonly version = '1.0.0'

  // ========================================
  // Detection & Priority
  // ========================================

  async detect(): Promise<boolean> {
    // Web platform is active when NOT running in any specialized environment

    // Check if running in MiniKit environment (Farcaster)
    try {
      // Dynamic import to avoid build errors if SDK not installed
      const { sdk } = await import('@farcaster/miniapp-sdk')

      // If SDK context exists, we're in Farcaster - NOT Web
      const context = await sdk.context
      if (context) {
        if (isDevelopment) {
          console.log('[WebPlatformPlugin] MiniKit context detected - NOT Web platform')
        }
        return false
      }
    } catch (error) {
      // SDK not available or import failed - this is fine for Web platform
      if (isDevelopment) {
        console.log('[WebPlatformPlugin] MiniKit SDK not available - defaulting to Web platform')
      }
    }

    // If we get here, we're running as a standard web app
    if (isDevelopment) {
      console.log('[WebPlatformPlugin] Detected as Web platform')
    }

    return true
  }

  getPriority(): number {
    // Lowest priority - Web platform is the fallback
    return 0
  }

  // ========================================
  // Configuration
  // ========================================

  getConfig(): PlatformConfig {
    return {
      tokenStorageType: 'none', // HttpOnly cookies managed by backend
      authMethod: 'wallet',
      supportedNetworks: [
        { chainId: 1, name: 'Ethereum Mainnet' },
        { chainId: 8453, name: 'Base' },
      ],
      ui: {
        brandColor: '#000000',
        connectButtonText: 'Connect Wallet',
        showNetworkSwitch: true,
      }
    }
  }

  getFeatures(): PlatformFeatures {
    return {
      wallet: true,
      notifications: false,
      sharing: true,
      deepLinks: false,
      storage: 'none',
    }
  }

  getConstraints(): PlatformConstraints {
    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedDomains: ['*'], // No domain restrictions for Web
      requiredPermissions: [], // No special permissions needed
    }
  }

  // ========================================
  // Strategy Factories
  // ========================================

  createAuthStrategy(): IAuthStrategy {
    // ❌ Strategy creation moved to useAuth hook to avoid React hooks violation
    // Strategies are now created with Dependency Injection in hooks
    throw new Error('[WebPlatformPlugin] createAuthStrategy() called - use useAuth() hook instead')
  }

  createWalletStrategy(): IWalletStrategy {
    // ❌ Strategy creation moved to useWallet hook to avoid React hooks violation
    // Strategies are now created with Dependency Injection in hooks
    throw new Error('[WebPlatformPlugin] createWalletStrategy() called - use useWallet() hook instead')
  }

  createShareStrategy(): IShareStrategy {
    return new WebShareStrategy()
  }

  createUrlStrategy(): IUrlStrategy {
    return new WebUrlStrategy()
  }

  createTokenStorage(): ITokenStorage {
    // HttpOnly cookies are managed by the backend
    // No client-side token storage needed
    return new NoOpTokenStorage()
  }

  // ========================================
  // UI Components
  // ========================================

  getLayout(): ComponentType<LayoutProps> {
    return WebLayout
  }

  getAuthSection(): ComponentType {
    return WebAuthSection
  }

  // ========================================
  // Lifecycle Hooks
  // ========================================

  async onActivate(): Promise<void> {
    if (isDevelopment) {
      console.log('[WebPlatformPlugin] Platform activated')
    }
  }

  async onDeactivate(): Promise<void> {
    if (isDevelopment) {
      console.log('[WebPlatformPlugin] Platform deactivated')
    }
  }
}
