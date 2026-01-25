/**
 * Reward Strategy Interface
 *
 * Defines the contract for reward distribution implementations.
 * Each reward strategy (HeardPoints, NFT Mint, Prediction Market Pool, etc.) implements this interface.
 */

import { User } from '@/src/platforms/_core/shared/interfaces/IAuthProvider'
import { Survey } from './ISurveyType'

export interface RewardConfig {
  rewardType: 'points' | 'nft' | 'token' | 'pool' | 'none'
  amount?: number
  tokenAddress?: string
  nftContractAddress?: string
  poolDistribution?: {
    winnersPercentage: number
    platformFee: number
  }
}

export interface RewardDistributionResult {
  success: boolean
  txHash?: string
  nftTokenId?: string
  amountDistributed?: number
  error?: string
}

export interface IRewardStrategy {
  // ========================================
  // Identity
  // ========================================

  /** Unique strategy identifier (e.g., 'heard-points', 'nft-mint', 'prediction-pool') */
  readonly id: string

  /** Human-readable strategy name */
  readonly name: string

  // ========================================
  // Configuration
  // ========================================

  /**
   * Get reward configuration
   * Defines reward type, amounts, and distribution rules
   */
  getConfig(): RewardConfig

  // ========================================
  // Reward Distribution
  // ========================================

  /**
   * Distribute reward to a single user
   * Called when user completes survey
   *
   * @param user - User receiving the reward
   * @param survey - Survey that was completed
   * @returns distribution result with transaction details
   */
  distribute(user: User, survey: Survey): Promise<RewardDistributionResult>

  /**
   * Distribute rewards to multiple winners
   * Used for prediction markets, competitions, etc.
   *
   * @param winners - Array of users who won
   * @param totalPool - Total reward pool to distribute
   * @returns array of distribution results
   */
  distributeToWinners?(winners: User[], totalPool: number): Promise<RewardDistributionResult[]>

  /**
   * Mint NFT reward
   * Used for NFT-gated surveys
   *
   * @param user - User receiving the NFT
   * @param survey - Survey that was completed
   * @returns distribution result with NFT token ID
   */
  mintNft?(user: User, survey: Survey): Promise<RewardDistributionResult>

  /**
   * Calculate reward amount for user
   * Can be dynamic based on user performance, pool size, etc.
   *
   * @param user - User to calculate reward for
   * @param survey - Survey context
   * @returns calculated reward amount
   */
  calculateRewardAmount?(user: User, survey: Survey): Promise<number>

  // ========================================
  // Validation
  // ========================================

  /**
   * Validate reward configuration
   * Called when creating/updating survey
   *
   * @param config - Reward configuration to validate
   * @returns true if valid
   */
  validateConfig?(config: Partial<RewardConfig>): boolean
}
