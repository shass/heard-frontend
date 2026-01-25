/**
 * Access Strategy Interface
 *
 * Defines the contract for access control implementations.
 * Each access strategy (Whitelist, OAuth, NFT Ownership, etc.) implements this interface.
 */

import { ComponentType } from 'react'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import {
  AccessCheckResult,
  AccessStrategyConfig,
  ConfigUIProps,
  AccessInstructionsProps
} from './types'
import { Survey } from './ISurveyType'

export interface IAccessStrategy {
  // ========================================
  // Identity
  // ========================================

  /** Unique strategy identifier (e.g., 'whitelist', 'twitter-oauth', 'nft-ownership') */
  readonly id: string

  /** Human-readable strategy name */
  readonly name: string

  /** Description of what this strategy checks */
  readonly description: string

  // ========================================
  // Configuration
  // ========================================

  /**
   * Configure strategy with specific parameters
   * Called when strategy is instantiated with survey-specific config
   *
   * @param config - Strategy-specific configuration object
   */
  configure(config: unknown): void

  /**
   * Get strategy configuration
   * Returns priority, combine mode, and enabled state
   */
  getConfig(): AccessStrategyConfig

  // ========================================
  // Access Check
  // ========================================

  /**
   * Check if user has access according to this strategy
   * This is the core access control logic
   *
   * @param user - User attempting to access
   * @param survey - Survey being accessed
   * @returns access check result with allow/deny and optional action required
   */
  checkAccess(user: User, survey: Survey): Promise<AccessCheckResult>

  // ========================================
  // UI Components
  // ========================================

  /**
   * Get configuration UI component
   * Displayed in admin panel when configuring this strategy
   * Allows admins to set strategy-specific parameters
   */
  getConfigUI(): ComponentType<ConfigUIProps>

  /**
   * Get access instructions UI component
   * Displayed to users when they don't have access
   * Shows what they need to do to gain access
   */
  getAccessInstructionsUI(): ComponentType<AccessInstructionsProps>
}
