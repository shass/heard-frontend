import type {
  ISurveyStrategy,
  RewardDisplayParams,
  SurveyInfoConfig,
  RewardDisplay
} from './ISurveyStrategy'
import { RewardSource } from './ISurveyStrategy'
import type { Survey } from '@/lib/types'
import { formatNumber } from '@/lib/utils'

/**
 * Strategy for prediction surveys
 * These surveys have start/end dates and may have winners
 */
export class PredictionSurveyStrategy implements ISurveyStrategy {
  isAvailable(survey: Survey): boolean {
    if (!survey.isActive) {
      return false
    }

    const now = new Date()
    const startDate = survey.startDate ? new Date(survey.startDate) : null
    const endDate = survey.endDate ? new Date(survey.endDate) : null

    // Check if survey has started
    if (startDate && now < startDate) {
      return false
    }

    // Check if survey has ended
    if (endDate && now >= endDate) {
      return false
    }

    return true
  }

  getRewardSource(): RewardSource {
    // Prediction surveys use winnerStatus for claim links
    return RewardSource.WINNER_STATUS
  }

  getClaimLink(params: RewardDisplayParams): string | undefined {
    // For prediction surveys, claim link comes from winner status
    return params.winnerStatus?.reward?.rewardLink
  }

  shouldShowWinnerInfo(_params: RewardDisplayParams): boolean {
    // Always show specific message for this survey type
    return true
  }

  getInfoConfig(survey: Survey): SurveyInfoConfig {
    const now = new Date()
    const endDate = survey.endDate ? new Date(survey.endDate) : null
    const hasEnded = endDate ? now >= endDate : false

    return {
      showDates: true,
      showResultsPageLink: hasEnded && !!survey.resultsPageUrl,
      showWinnerInfo: hasEnded,
      showTokenReward: true
    }
  }

  getUnavailableMessage(survey: Survey): string | null {
    if (!survey.isActive) {
      return "This survey is currently inactive."
    }

    const now = new Date()
    const startDate = survey.startDate ? new Date(survey.startDate) : null
    const endDate = survey.endDate ? new Date(survey.endDate) : null

    if (startDate && now < startDate) {
      return `This survey will start on ${startDate.toLocaleDateString()}.`
    }

    if (endDate && now >= endDate) {
      return "This survey has ended."
    }

    return null
  }

  getRewardDisplay(survey: Survey, _context?: 'list' | 'detail'): RewardDisplay {
    const parts: string[] = []
    const rewardParts: RewardDisplay['parts'] = {}

    // Token reward
    if (survey.rewardAmount > 0) {
      parts.push(`${formatNumber(survey.rewardAmount)} ${survey.rewardToken}`)
      rewardParts.token = {
        amount: survey.rewardAmount,
        symbol: survey.rewardToken
      }
    }

    // HeardPoints reward
    if (survey.heardPointsReward > 0) {
      parts.push(`${formatNumber(survey.heardPointsReward)} HP`)
      rewardParts.heardPoints = {
        amount: survey.heardPointsReward
      }
    }

    return {
      formatted: parts.join(' + '),
      parts: rewardParts,
      displayMode: 'detailed'
    }
  }

  getTypeLabel(): string {
    return 'Prediction Survey'
  }

  shouldShowEndDateCard(survey: Survey): boolean {
    // Show end date card if survey has an end date
    return !!survey.endDate
  }
}
