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
 * Strategy for standard surveys
 * Standard surveys are always available and don't have time constraints
 */
export class StandardSurveyStrategy implements ISurveyStrategy {
  isAvailable(survey: Survey): boolean {
    // Standard surveys are always available if active
    return survey.isActive
  }

  getRewardSource(): RewardSource {
    // Standard surveys use userReward for claim links
    return RewardSource.USER_REWARD
  }

  getClaimLink(params: RewardDisplayParams): string | undefined {
    return params.userReward?.claimLink
  }

  shouldShowWinnerInfo(_params: RewardDisplayParams): boolean {
    // Standard surveys don't have winners
    return false
  }

  getInfoConfig(_survey: Survey): SurveyInfoConfig {
    return {
      showDates: false,
      showResultsPageLink: false,
      showWinnerInfo: false,
      showTokenReward: true
    }
  }

  getUnavailableMessage(survey: Survey): string | null {
    if (!survey.isActive) {
      return "This survey is currently inactive."
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
    return 'Standard'
  }

  shouldShowEndDateCard(_survey: Survey): boolean {
    // Standard surveys don't have end date display on reward page
    return false
  }
}
