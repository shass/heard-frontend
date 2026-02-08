/**
 * Whitelist Access Strategy
 *
 * Checks if user's wallet address is whitelisted for the survey
 * Highest priority strategy (100) - checked first
 */

import React, { ComponentType } from 'react'
import { IAccessStrategy } from '@/src/core/interfaces/IAccessStrategy'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import {
  AccessCheckResult,
  AccessStrategyConfig,
  ConfigUIProps,
  AccessInstructionsProps
} from '@/src/core/interfaces/types'
import { Survey } from '@/src/core/interfaces/ISurveyType'
import { surveyApi } from '@/lib/api/surveys'
import { WhitelistConfigUI } from './components/WhitelistConfigUI'

export class WhitelistAccessStrategy implements IAccessStrategy {
  readonly id = 'whitelist'
  readonly name = 'Whitelist'
  readonly description = 'Require wallet address to be whitelisted'

  private config: unknown = null

  configure(config: unknown): void {
    this.config = config
    if (process.env.NODE_ENV === 'development') {
      console.log('[WhitelistAccessStrategy] Configured with:', config)
    }
  }

  getConfig(): AccessStrategyConfig {
    return {
      enabled: true,
      priority: 100,
      combineMode: 'AND'
    }
  }

  async checkAccess(user: User, survey: Survey): Promise<AccessCheckResult> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WhitelistAccessStrategy] Checking access for user:', user.id, 'survey:', survey.id)
    }

    if (!user.walletAddress) {
      return {
        allowed: false,
        reason: 'Wallet address required for whitelist check'
      }
    }

    try {
      // Import error handling utilities dynamically to avoid circular deps
      const { withRetry, withTimeout } = await import('@/src/core/utils/error-handling')

      // Try API check with retry and timeout
      const eligibility = await withRetry(
        () => withTimeout(
          surveyApi.checkEligibility(survey.id, {
            walletAddress: user.walletAddress
          }),
          { timeoutMs: 5000 }
        ),
        {
          maxAttempts: 3,
          baseDelay: 500,
          onRetry: (attempt, error) => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[WhitelistAccessStrategy] Retry attempt ${attempt}:`, error.message)
            }
          }
        }
      )

      if (process.env.NODE_ENV === 'development') {
        console.log('[WhitelistAccessStrategy] Eligibility response:', eligibility)
      }

      if (eligibility.isEligible) {
        return { allowed: true }
      }

      return {
        allowed: false,
        reason: eligibility.reason || 'Wallet address not whitelisted'
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[WhitelistAccessStrategy] API check failed:', error)
      }
      return {
        allowed: false,
        reason: 'Unable to verify whitelist status'
      }
    }
  }

  getConfigUI(): ComponentType<ConfigUIProps> {
    return WhitelistConfigUI
  }

  getAccessInstructionsUI(): ComponentType<AccessInstructionsProps> {
    return ({ requiresAction }) => (
      <div>
        <p>{requiresAction?.instructions || 'Wallet address not whitelisted'}</p>
        <p>Contact survey creator to be added to whitelist.</p>
      </div>
    )
  }
}
