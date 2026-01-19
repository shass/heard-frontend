/**
 * HeardPoints Reward Strategy
 *
 * Distributes HeardPoints to users upon survey completion.
 * Uses backend API to award points and update user balance.
 */

import {
  IRewardStrategy,
  RewardConfig,
  RewardDistributionResult
} from '@/src/core/interfaces/IRewardStrategy'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { Survey } from '@/src/core/interfaces/ISurveyType'
import { apiClient } from '@/lib/api/client'

export class HeardPointsRewardStrategy implements IRewardStrategy {
  readonly id = 'heard-points'
  readonly name = 'HeardPoints Reward'

  /**
   * Get reward configuration
   */
  getConfig(): RewardConfig {
    return {
      rewardType: 'points'
    }
  }

  /**
   * Distribute HeardPoints to user via backend API
   *
   * @param user - User receiving the reward
   * @param survey - Survey that was completed
   * @returns distribution result
   */
  async distribute(user: User, survey: Survey): Promise<RewardDistributionResult> {
    try {
      const amount = survey.heardPointsReward || 0

      if (amount <= 0) {
        return {
          success: false,
          error: 'Survey has no HeardPoints reward configured'
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[HeardPointsRewardStrategy] Distributing ${amount} points to user ${user.id} for survey ${survey.id}`
        )
      }

      // Award points via backend API
      // The backend handles validation and balance update
      await apiClient.post(`/surveys/${survey.id}/complete`, {
        userId: user.id
      })

      if (process.env.NODE_ENV === 'development') {
        console.log(`[HeardPointsRewardStrategy] ✅ Successfully distributed ${amount} points`)
      }

      return {
        success: true,
        amountDistributed: amount
      }
    } catch (error) {
      console.error('[HeardPointsRewardStrategy] Error distributing reward:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to distribute reward'
      }
    }
  }

  /**
   * Validate reward configuration
   *
   * @param config - Reward configuration to validate
   * @returns true if valid
   */
  validateConfig(config: Partial<RewardConfig>): boolean {
    if (config.rewardType && config.rewardType !== 'points') {
      return false
    }

    if (config.amount !== undefined && config.amount < 0) {
      return false
    }

    return true
  }
}
