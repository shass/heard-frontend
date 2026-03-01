/**
 * Farcaster Platform Plugin
 *
 * Implements platform-specific integration for Farcaster (Warpcast) MiniApp environment.
 * Handles authentication via Quick Auth, wallet management, and social sharing.
 *
 * Detection: Checks for Warpcast clientFid (9152) via @farcaster/miniapp-sdk
 * Auth: Quick Auth (cryptographically verified JWT tokens)
 * Network: Base (chainId 8453) only
 * Storage: localStorage (mini-app environment)
 *
 * @see https://miniapps.farcaster.xyz/docs
 */

import { ComponentType } from 'react'
import { IPlatformPlugin } from '@/src/core/interfaces/IPlatformPlugin'
import {
  PlatformConfig,
  PlatformFeatures,
  PlatformConstraints,
  LayoutProps,
} from '@/src/core/interfaces/types'
import { IAuthStrategy } from '@/src/platforms/_core/shared/interfaces/IAuthStrategy'
import { IWalletStrategy } from '@/src/platforms/_core/shared/interfaces/IWalletStrategy'
import { IShareStrategy } from '@/src/platforms/_core/shared/interfaces/IShareStrategy'
import { IUrlStrategy } from '@/src/platforms/_core/shared/interfaces/IUrlStrategy'
import { ITokenStorage } from '@/lib/api/token-storage'
import { LocalStorageTokenStorage } from '@/lib/api/token-storage'

// Import Farcaster-specific strategies
// Strategy wrappers removed - strategies now created via DI in hooks
import { FarcasterShareStrategy } from './strategies/FarcasterShareStrategy'
import { FarcasterUrlStrategy } from './strategies/FarcasterUrlStrategy'

// Import Farcaster UI components
import FarcasterLayout from './layouts/FarcasterLayout'
import { FarcasterAuthSection } from './components/FarcasterAuthSection'

export class FarcasterPlatformPlugin implements IPlatformPlugin {
  // ========================================
  // Identity
  // ========================================

  readonly id = 'farcaster'
  readonly name = 'Farcaster'
  readonly version = '1.0.0'

  // ========================================
  // Detection & Priority
  // ========================================

  /**
   * Detect if running in Farcaster (Warpcast) environment
   * Checks for Warpcast clientFid (9152) via @farcaster/miniapp-sdk
   */
  async detect(): Promise<boolean> {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')
      const context = await sdk.context
      const clientFid = context?.client?.clientFid?.toString()

      const isWarpcast = clientFid === '9152'

      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterPlatformPlugin] Detection:', {
          clientFid,
          isWarpcast,
          context,
        })
      }

      return isWarpcast
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[FarcasterPlatformPlugin] Detection failed (not in Farcaster):', error)
      }
      return false
    }
  }

  /**
   * Priority: 20 (same as BaseApp, but distinct detection logic)
   * Higher priority than Web (10) to ensure proper detection in Farcaster environment
   */
  getPriority(): number {
    return 20
  }

  // ========================================
  // Configuration
  // ========================================

  getConfig(): PlatformConfig {
    return {
      tokenStorageType: 'localStorage',
      authMethod: 'quickAuth',
      supportedNetworks: [
        {
          chainId: 8453,
          name: 'Base',
        },
      ],
      ui: {
        brandColor: '#8A63D2',
        connectButtonText: 'Quick Connect',
        showNetworkSwitch: false,
      },
    }
  }

  getFeatures(): PlatformFeatures {
    return {
      wallet: true,
      notifications: true,
      sharing: true,
      deepLinks: true,
      storage: 'localStorage',
    }
  }

  getConstraints(): PlatformConstraints {
    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedDomains: ['*'], // Farcaster allows all domains
      requiredPermissions: ['wallet', 'profile'],
    }
  }

  // ========================================
  // Strategy Factories
  // ========================================

  createAuthStrategy(): IAuthStrategy {
    // ❌ Strategy creation moved to useAuth hook to avoid React hooks violation
    throw new Error('[FarcasterPlatformPlugin] createAuthStrategy() called - use useAuth() hook instead')
  }

  createWalletStrategy(): IWalletStrategy {
    // ❌ Strategy creation moved to useWallet hook to avoid React hooks violation
    throw new Error('[FarcasterPlatformPlugin] createWalletStrategy() called - use useWallet() hook instead')
  }

  createShareStrategy(): IShareStrategy {
    return new FarcasterShareStrategy()
  }

  createUrlStrategy(): IUrlStrategy {
    return new FarcasterUrlStrategy()
  }

  createTokenStorage(): ITokenStorage {
    return new LocalStorageTokenStorage()
  }

  // ========================================
  // UI Components
  // ========================================

  getLayout(): ComponentType<LayoutProps> {
    return FarcasterLayout
  }

  getAuthSection(): ComponentType {
    return FarcasterAuthSection
  }

  // ========================================
  // Lifecycle Hooks
  // ========================================

  async onActivate(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[FarcasterPlatformPlugin] Platform activated')
      console.log('[FarcasterPlatformPlugin] Features:', this.getFeatures())
      console.log('[FarcasterPlatformPlugin] Config:', this.getConfig())
    }

    // Context was already validated during detect() — no need to await it again.
    // Calling sdk.context here without a timeout would hang bootstrap indefinitely
    // if the host doesn't respond to the comlink call.
  }

  async onDeactivate(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[FarcasterPlatformPlugin] Platform deactivated')
    }

    // Cleanup if needed
  }
}
