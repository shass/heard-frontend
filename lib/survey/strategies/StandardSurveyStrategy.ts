import type {
  ISurveyStrategy,
  ButtonState,
  ButtonStateParams,
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
  getButtonState(params: ButtonStateParams): ButtonState {
    const {
      hasCompleted,
      hasStarted,
      isConnected,
      isEligible,
      isAuthenticated,
      isAuthLoading,
      isEligibilityLoading,
      handleStartSurvey,
      handleConnectWallet,
      handleAuthenticate,
      accessStrategies,
      handleVerifyBringId,
      isBringIdVerifying
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

    // Eligibility check in progress
    if (isEligibilityLoading) {
      return {
        text: "Checking eligibility...",
        disabled: true,
        handler: () => {},
        loading: true
      }
    }

    // User not eligible
    if (!isEligible) {
      // Check if BringId verification is available
      const hasBringId = accessStrategies?.includes('bringid')
      if (hasBringId && handleVerifyBringId) {
        return {
          text: isBringIdVerifying ? "Verifying..." : "Verify with BringId",
          disabled: isBringIdVerifying || false,
          handler: handleVerifyBringId,
          loading: isBringIdVerifying || false
        }
      }

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

    // Ready to continue or start
    return {
      text: hasStarted ? "Continue" : "Start Survey",
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
