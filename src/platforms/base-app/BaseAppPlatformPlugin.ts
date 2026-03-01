/**
 * BaseApp Platform Plugin
 *
 * Implements IPlatformPlugin for the BaseApp platform (Farcaster miniapp with clientFid 309857).
 * Provides authentication, wallet, sharing, and URL strategies optimized for BaseApp environment.
 */

import { ComponentType } from 'react'
import { IPlatformPlugin } from '@/src/core/interfaces/IPlatformPlugin'
import { IAuthStrategy } from '@/src/platforms/_core/shared/interfaces/IAuthStrategy'
import { IWalletStrategy } from '@/src/platforms/_core/shared/interfaces/IWalletStrategy'
import { IShareStrategy } from '@/src/platforms/_core/shared/interfaces/IShareStrategy'
import { IUrlStrategy } from '@/src/platforms/_core/shared/interfaces/IUrlStrategy'
import { ITokenStorage } from '@/lib/api/token-storage'
import {
  PlatformConfig,
  PlatformFeatures,
  PlatformConstraints,
  LayoutProps
} from '@/src/core/interfaces/types'

// Strategy wrappers removed - strategies now created via DI in hooks
import { BaseAppShareStrategy } from './strategies/BaseAppShareStrategy'
import { BaseAppUrlStrategy } from './strategies/BaseAppUrlStrategy'
import BaseAppLayout from './layouts/BaseAppLayout'
import { BaseAppAuthSection } from './components/BaseAppAuthSection'
import { LocalStorageTokenStorage } from '@/lib/api/token-storage/LocalStorageTokenStorage'

const DEV_MODE = process.env.NODE_ENV === 'development'
const BASE_APP_CLIENT_FID = '309857'

export class BaseAppPlatformPlugin implements IPlatformPlugin {
  readonly id = 'base-app'
  readonly name = 'BaseApp'
  readonly version = '1.0.0'

  async detect(): Promise<boolean> {
    if (DEV_MODE) {
      console.log('[BaseAppPlatformPlugin] Starting detection...')
    }

    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')

      // Fast check — short-circuits immediately in non-mini-app environments
      const isMiniApp = await sdk.isInMiniApp()
      if (!isMiniApp) {
        if (DEV_MODE) {
          console.log('[BaseAppPlatformPlugin] Not in mini app environment')
        }
        return false
      }

      // We're in a mini app — check if it's specifically Base App
      const context = await sdk.context
      const clientFid = context?.client?.clientFid?.toString()

      if (DEV_MODE) {
        console.log('[BaseAppPlatformPlugin] Detection result:', {
          clientFid,
          isBaseApp: clientFid === BASE_APP_CLIENT_FID,
          context: context?.client
        })
      }

      return clientFid === BASE_APP_CLIENT_FID
    } catch (error) {
      if (DEV_MODE) {
        console.log('[BaseAppPlatformPlugin] Detection failed:', error)
      }
      return false
    }
  }

  getPriority(): number {
    return 30 // Higher than Farcaster (20) and Web (0)
  }

  getConfig(): PlatformConfig {
    return {
      tokenStorageType: 'localStorage',
      authMethod: 'quickAuth',
      supportedNetworks: [
        {
          chainId: 8453,
          name: 'Base'
        }
      ],
      ui: {
        brandColor: '#0052FF',
        connectButtonText: 'Quick Connect',
        showNetworkSwitch: false
      }
    }
  }

  getFeatures(): PlatformFeatures {
    return {
      wallet: true,
      notifications: true,
      sharing: true,
      deepLinks: true,
      storage: 'localStorage'
    }
  }

  getConstraints(): PlatformConstraints {
    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedDomains: ['*'],
      requiredPermissions: []
    }
  }

  createAuthStrategy(): IAuthStrategy {
    // ❌ Strategy creation moved to useAuth hook to avoid React hooks violation
    throw new Error('[BaseAppPlatformPlugin] createAuthStrategy() called - use useAuth() hook instead')
  }

  createWalletStrategy(): IWalletStrategy {
    // ❌ Strategy creation moved to useWallet hook to avoid React hooks violation
    throw new Error('[BaseAppPlatformPlugin] createWalletStrategy() called - use useWallet() hook instead')
  }

  createShareStrategy(): IShareStrategy {
    return new BaseAppShareStrategy()
  }

  createUrlStrategy(): IUrlStrategy {
    return new BaseAppUrlStrategy()
  }

  createTokenStorage(): ITokenStorage {
    return new LocalStorageTokenStorage()
  }

  getLayout(): ComponentType<LayoutProps> {
    return BaseAppLayout
  }

  getAuthSection(): ComponentType {
    return BaseAppAuthSection
  }

  async onActivate(): Promise<void> {
    if (DEV_MODE) {
      console.log('[BaseAppPlatformPlugin] Platform activated')
      console.log('[BaseAppPlatformPlugin] Configuration:', this.getConfig())
      console.log('[BaseAppPlatformPlugin] Features:', this.getFeatures())
    }
  }

  async onDeactivate(): Promise<void> {
    if (DEV_MODE) {
      console.log('[BaseAppPlatformPlugin] Platform deactivated')
    }
  }
}
