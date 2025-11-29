import type {
  ISurveyStrategy,
  ButtonState,
  ButtonStateParams,
  RewardDisplayParams,
  SurveyInfoConfig
} from './ISurveyStrategy'
import { RewardSource } from './ISurveyStrategy'
import type { Survey } from '@/lib/types'

/**
 * Strategy for time-limited surveys
 * These surveys have start/end dates and may have winners
 */
export class TimeLimitedSurveyStrategy implements ISurveyStrategy {
  getButtonState(params: ButtonStateParams): ButtonState {
    const {
      survey,
      hasCompleted,
      isConnected,
      isEligible,
      isAuthenticated,
      isAuthLoading,
      handleStartSurvey,
      handleConnectWallet,
      handleAuthenticate
    } = params

    // Survey already completed
    if (hasCompleted) {
      return {
        text: "Survey Completed",
        disabled: true,
        handler: () => {},
        loading: false
      }
    }

    // Wallet not connected
    if (!isConnected) {
      return {
        text: "Connect Wallet",
        disabled: false,
        handler: handleConnectWallet,
        loading: false
      }
    }

    // User not eligible
    if (!isEligible) {
      return {
        text: "Not Eligible",
        disabled: true,
        handler: () => {},
        loading: false
      }
    }

    // Check time constraints
    const now = new Date()
    const startDate = survey.startDate ? new Date(survey.startDate) : null
    const endDate = survey.endDate ? new Date(survey.endDate) : null

    if (startDate && now < startDate) {
      return {
        text: "Survey Not Started Yet",
        disabled: true,
        handler: () => {},
        loading: false
      }
    }

    if (endDate && now >= endDate) {
      return {
        text: "Survey Ended",
        disabled: true,
        handler: () => {},
        loading: false
      }
    }

    // Not authenticated - need to sign message
    if (!isAuthenticated) {
      return {
        text: isAuthLoading ? "Authenticating..." : "Authorize & Start Survey",
        disabled: isAuthLoading,
        handler: handleAuthenticate,
        loading: isAuthLoading
      }
    }

    // Ready to start
    return {
      text: "Start Survey",
      disabled: false,
      handler: handleStartSurvey,
      loading: false
    }
  }

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
    // Time-limited surveys use winnerStatus for claim links
    return RewardSource.WINNER_STATUS
  }

  getClaimLink(params: RewardDisplayParams): string | undefined {
    // For time-limited surveys, claim link comes from winner status
    return params.winnerStatus?.reward?.rewardLink
  }

  shouldShowWinnerInfo(params: RewardDisplayParams): boolean {
    // Show winner info if the survey has ended
    const { survey } = params
    if (!survey.endDate) {
      return false
    }

    const now = new Date()
    const endDate = new Date(survey.endDate)
    return now >= endDate
  }

  getInfoConfig(survey: Survey): SurveyInfoConfig {
    const now = new Date()
    const endDate = survey.endDate ? new Date(survey.endDate) : null
    const hasEnded = endDate ? now >= endDate : false

    return {
      showDates: true,
      showResultsPageLink: hasEnded && !!survey.resultsPageUrl,
      showWinnerInfo: hasEnded,
      showTokenReward: false
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
}
