/**
 * Platform Plugin Interface
 *
 * Defines the contract that all platform implementations must follow.
 * Each platform (Web, BaseApp, Farcaster, Telegram, etc.) implements this interface.
 */

import { ComponentType } from 'react'
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
} from './types'

export interface IPlatformPlugin {
  // ========================================
  // Identity
  // ========================================

  /** Unique platform identifier (e.g., 'web', 'base-app', 'farcaster') */
  readonly id: string

  /** Human-readable platform name */
  readonly name: string

  /** Plugin version (semver) */
  readonly version: string

  // ========================================
  // Detection & Priority
  // ========================================

  /**
   * Detect if this platform is currently active
   * Called during platform detection phase
   *
   * @returns true if this platform should be activated
   */
  detect(): Promise<boolean>

  /**
   * Get platform detection priority
   * Higher priority platforms are checked first
   * Use this to resolve conflicts when multiple platforms detect as active
   *
   * @returns priority number (higher = higher priority)
   */
  getPriority(): number

  // ========================================
  // Configuration
  // ========================================

  /**
   * Get platform configuration
   * Defines how the platform handles auth, storage, networks, etc.
   */
  getConfig(): PlatformConfig

  /**
   * Get platform features and capabilities
   * Used to filter available survey types and features
   */
  getFeatures(): PlatformFeatures

  /**
   * Get platform constraints and limitations
   * Used for validation and user feedback
   */
  getConstraints(): PlatformConstraints

  // ========================================
  // Strategy Factories
  // ========================================

  /**
   * Create authentication strategy for this platform
   * Strategy handles user authentication flow
   */
  createAuthStrategy(): IAuthStrategy

  /**
   * Create wallet strategy for this platform
   * Strategy handles wallet connection and transactions
   */
  createWalletStrategy(): IWalletStrategy

  /**
   * Create share strategy for this platform
   * Strategy handles content sharing (social, clipboard, etc.)
   */
  createShareStrategy(): IShareStrategy

  /**
   * Create URL opening strategy for this platform
   * Strategy handles opening external URLs
   */
  createUrlStrategy(): IUrlStrategy

  /**
   * Create token storage implementation for this platform
   * Storage handles auth token persistence (localStorage, cookies, etc.)
   */
  createTokenStorage(): ITokenStorage

  // ========================================
  // UI Components
  // ========================================

  /**
   * Get platform-specific layout component
   * Wraps the entire application with platform-specific providers
   */
  getLayout(): ComponentType<LayoutProps>

  /**
   * Get platform-specific auth section component
   * Displays authentication UI (connect button, user menu, etc.)
   */
  getAuthSection(): ComponentType

  // ========================================
  // Lifecycle Hooks
  // ========================================

  /**
   * Called when platform is activated
   * Use for initialization, SDK setup, etc.
   */
  onActivate?(): Promise<void>

  /**
   * Called when platform is deactivated
   * Use for cleanup, unsubscribe, etc.
   */
  onDeactivate?(): Promise<void>
}
