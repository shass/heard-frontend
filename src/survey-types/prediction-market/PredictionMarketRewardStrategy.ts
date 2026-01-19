/**
 * Prediction Market Pool Reward Strategy
 *
 * Distributes reward pool to users who made correct predictions.
 * Pool is split equally among winners, with platform fee deducted.
 */

import {
  IRewardStrategy,
  RewardConfig,
  RewardDistributionResult,
} from '@/src/core/interfaces/IRewardStrategy'
import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { Survey } from '@/src/core/interfaces/ISurveyType'

const PLATFORM_FEE = 0.05 // 5%
const WINNERS_PERCENTAGE = 0.95 // 95%

export class PredictionMarketRewardStrategy implements IRewardStrategy {
  readonly id = 'prediction-pool'
  readonly name = 'Prediction Market Pool'

  getConfig(): RewardConfig {
    return {
      rewardType: 'pool',
      poolDistribution: {
        winnersPercentage: WINNERS_PERCENTAGE,
        platformFee: PLATFORM_FEE,
      },
    }
  }

  /**
   * Distribute reward to a single user (not typically used for prediction markets)
   */
  async distribute(user: User, survey: Survey): Promise<RewardDistributionResult> {
    console.warn('[PredictionMarketRewardStrategy] distribute() called for single user - use distributeToWinners() instead')

    return {
      success: false,
      error: 'Use distributeToWinners() for prediction market rewards',
    }
  }

  /**
   * Distribute pool to all winners
   * Pool split equally among correct predictors
   */
  async distributeToWinners(
    winners: User[],
    totalPool: number
  ): Promise<RewardDistributionResult[]> {
    console.log('[PredictionMarketRewardStrategy] distributeToWinners', {
      winnersCount: winners.length,
      totalPool,
    })

    if (winners.length === 0) {
      console.warn('[PredictionMarketRewardStrategy] No winners to distribute to')
      return []
    }

    if (totalPool <= 0) {
      console.warn('[PredictionMarketRewardStrategy] Invalid pool amount', { totalPool })
      return []
    }

    // Calculate distribution
    const winnersPool = totalPool * WINNERS_PERCENTAGE
    const rewardPerWinner = winnersPool / winners.length

    console.log('[PredictionMarketRewardStrategy] Distribution calculated', {
      totalPool,
      platformFee: totalPool * PLATFORM_FEE,
      winnersPool,
      rewardPerWinner,
    })

    // Distribute to each winner
    const results: RewardDistributionResult[] = []

    for (const winner of winners) {
      try {
        // TODO: Integrate with backend API to distribute HeardPoints
        // For now, simulate successful distribution

        console.log('[PredictionMarketRewardStrategy] Distributing to winner', {
          userId: winner.id,
          walletAddress: winner.walletAddress,
          amount: rewardPerWinner,
        })

        results.push({
          success: true,
          amountDistributed: rewardPerWinner,
          // txHash will be added when blockchain integration is implemented
        })
      } catch (error) {
        console.error('[PredictionMarketRewardStrategy] Distribution failed for user', {
          userId: winner.id,
          error,
        })

        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log('[PredictionMarketRewardStrategy] Distribution complete', {
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
    })

    return results
  }

  /**
   * Calculate reward amount for a single winner
   */
  async calculateRewardAmount(user: User, survey: Survey): Promise<number> {
    // Get total pool from survey
    const totalPool = (survey as any).totalPool || 0

    // Get total winners count (will be fetched from survey responses)
    const winnersCount = (survey as any).winnersCount || 1

    if (winnersCount === 0) {
      console.warn('[PredictionMarketRewardStrategy] No winners found')
      return 0
    }

    const winnersPool = totalPool * WINNERS_PERCENTAGE
    const rewardPerWinner = winnersPool / winnersCount

    console.log('[PredictionMarketRewardStrategy] calculateRewardAmount', {
      userId: user.id,
      totalPool,
      winnersCount,
      rewardPerWinner,
    })

    return rewardPerWinner
  }

  /**
   * Validate reward configuration
   */
  validateConfig(config: Partial<RewardConfig>): boolean {
    if (config.rewardType !== 'pool') {
      console.error('[PredictionMarketRewardStrategy] Invalid reward type', config.rewardType)
      return false
    }

    if (config.poolDistribution) {
      const { winnersPercentage, platformFee } = config.poolDistribution

      if (winnersPercentage + platformFee !== 1.0) {
        console.error('[PredictionMarketRewardStrategy] Pool distribution must sum to 1.0', {
          winnersPercentage,
          platformFee,
        })
        return false
      }

      if (winnersPercentage < 0 || winnersPercentage > 1) {
        console.error('[PredictionMarketRewardStrategy] Invalid winnersPercentage', winnersPercentage)
        return false
      }

      if (platformFee < 0 || platformFee > 1) {
        console.error('[PredictionMarketRewardStrategy] Invalid platformFee', platformFee)
        return false
      }
    }

    return true
  }
}
