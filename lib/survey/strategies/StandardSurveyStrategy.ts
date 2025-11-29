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
 * Strategy for standard surveys
 * Standard surveys are always available and don't have time constraints
 */
export class StandardSurveyStrategy implements ISurveyStrategy {
  getButtonState(params: ButtonStateParams): ButtonState {
    const {
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
}
