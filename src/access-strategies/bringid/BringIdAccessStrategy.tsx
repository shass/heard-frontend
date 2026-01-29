/**
 * BringId Access Strategy
 *
 * Verifies user identity and reputation via BringId service.
 * Checks wallet reputation score against minimum threshold.
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
import { BringIdConfigUI } from './components/BringIdConfigUI'
import { BringIdInstructions } from './components/BringIdInstructions'

interface BringIdConfig {
  minScore?: number
  requireHumanityProof?: boolean
}

// Extended eligibility response with accessStrategies field
// This field will be added to EligibilityResponse in Phase 1 (backend)
interface ExtendedEligibilityResponse {
  isEligible: boolean
  hasStarted: boolean
  hasCompleted: boolean
  reason?: string
  accessStrategies?: Record<string, {
    passed: boolean
    reason?: string
    score?: number
  }>
}

export class BringIdAccessStrategy implements IAccessStrategy {
  readonly id = 'bringid'
  readonly name = 'BringId Reputation'
  readonly description = 'Verify identity and reputation via BringId'

  private config: BringIdConfig = {}

  configure(config: unknown): void {
    this.config = (config || {}) as BringIdConfig
    if (process.env.NODE_ENV === 'development') {
      console.log('[BringIdAccessStrategy] Configured with:', this.config)
    }
  }

  getConfig(): AccessStrategyConfig {
    return {
      enabled: true,
      priority: 90, // Lower than whitelist (100)
      combineMode: 'AND'
    }
  }

  async checkAccess(user: User, survey: Survey): Promise<AccessCheckResult> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BringIdAccessStrategy] Checking access for user:', user.id, 'survey:', survey.id)
    }

    if (!user.walletAddress) {
      return {
        allowed: false,
        reason: 'Wallet address required for BringId verification'
      }
    }

    try {
      // Import error handling utilities dynamically to avoid circular deps
      const { withRetry, withTimeout } = await import('@/src/core/utils/error-handling')

      // Try API check with retry and timeout
      // Cast to ExtendedEligibilityResponse to handle accessStrategies field
      // (will be added to backend in Phase 1)
      const eligibility = await withRetry(
        () => withTimeout(
          surveyApi.checkEligibility(survey.id, {
            walletAddress: user.walletAddress
          }),
          { timeoutMs: 10000 } // BringId may take longer than whitelist
        ),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[BringIdAccessStrategy] Retry attempt ${attempt}:`, error.message)
            }
          }
        }
      ) as ExtendedEligibilityResponse

      if (process.env.NODE_ENV === 'development') {
        console.log('[BringIdAccessStrategy] Eligibility response:', eligibility)
      }

      if (eligibility.isEligible) {
        return { allowed: true }
      }

      // Check BringId specific result
      const bringidResult = eligibility.accessStrategies?.bringid
      if (bringidResult && !bringidResult.passed) {
        const minScore = (survey as any).accessStrategyConfigs?.bringid?.config?.minScore || 50
        return {
          allowed: false,
          reason: bringidResult.reason || `BringId score below ${minScore}`,
          requiresAction: {
            type: 'install-extension' as any, // Using closest available type
            instructions: 'Complete BringId verification to increase your score'
          }
        }
      }

      return {
        allowed: false,
        reason: eligibility.reason || 'BringId verification required'
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[BringIdAccessStrategy] API check failed:', error)
      }

      const isTimeout = error instanceof Error && error.message.includes('timeout')
      const isNetworkError = error instanceof Error && (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.name === 'AbortError'
      )

      if (isTimeout) {
        return {
          allowed: false,
          reason: 'BringId verification is taking too long. Please try again.'
        }
      }

      if (isNetworkError) {
        return {
          allowed: false,
          reason: "We couldn't verify your BringId status due to a network issue. Please check your connection and try again."
        }
      }

      return {
        allowed: false,
        reason: 'BringId verification service is currently unavailable. Please try again later.'
      }
    }
  }

  getConfigUI(): ComponentType<ConfigUIProps> {
    return BringIdConfigUI
  }

  getAccessInstructionsUI(): ComponentType<AccessInstructionsProps> {
    return BringIdInstructions
  }
}
