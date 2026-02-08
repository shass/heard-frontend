import type { Survey, WinnerStatus, LinkdropReward } from '@/lib/types'

// Reward source type
export enum RewardSource {
  USER_REWARD = 'userReward',
  WINNER_STATUS = 'winnerStatus',
  BOTH = 'both'
}

// Reward display configuration
export interface RewardDisplay {
  formatted: string // Complete formatted string ready for display
  parts?: {
    token?: {
      amount: number
      symbol: string
    }
    heardPoints?: {
      amount: number
    }
  }
  displayMode: 'simple' | 'detailed'
}

// Access strategy configuration
export interface AccessStrategyConfig {
  enabled: boolean
  config?: {
    minScore?: number
    requireHumanityProof?: boolean
  }
}

// Parameters for reward display logic
export interface RewardDisplayParams {
  survey: Survey
  userReward?: LinkdropReward
  winnerStatus?: WinnerStatus
}

// Survey information display configuration
export interface SurveyInfoConfig {
  showDates: boolean
  showResultsPageLink: boolean
  showWinnerInfo: boolean
  showTokenReward: boolean
}

/**
 * Strategy interface for different survey types
 * Each survey type implements this interface to provide type-specific behavior
 */
export interface ISurveyStrategy {
  /**
   * Check if survey is currently available for participation
   */
  isAvailable(survey: Survey): boolean

  /**
   * Get the source of reward information (userReward or winnerStatus)
   */
  getRewardSource(): RewardSource

  /**
   * Get claim link from appropriate source
   */
  getClaimLink(params: RewardDisplayParams): string | undefined

  /**
   * Determine if winner information should be displayed
   */
  shouldShowWinnerInfo(params: RewardDisplayParams): boolean

  /**
   * Get configuration for survey info display
   */
  getInfoConfig(survey: Survey): SurveyInfoConfig

  /**
   * Get custom validation message if survey is not available
   */
  getUnavailableMessage(survey: Survey): string | null

  /**
   * Get formatted reward display for list/table/card views
   */
  getRewardDisplay(survey: Survey, context?: 'list' | 'detail'): RewardDisplay

  /**
   * Get human-readable type label
   */
  getTypeLabel(): string

  /**
   * Check if survey should display end date card on reward page
   */
  shouldShowEndDateCard(survey: Survey): boolean
}
