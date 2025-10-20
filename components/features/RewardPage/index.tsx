"use client"

import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-states"
import { Gift } from "lucide-react"
import type { Survey } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { useRewardPage } from './hooks/useRewardPage'
import { RewardHeader } from './RewardHeader'
import { RewardDetails } from './RewardDetails'
import { ClaimSection } from './ClaimSection'
import { RewardActions } from './RewardActions'

interface RewardPageProps {
  survey: Survey
  onBackToSurveys: () => void
  responseId?: string
}

export function RewardPage({ survey, onBackToSurveys, responseId }: RewardPageProps) {
  const {
    qrCodeUrl,
    claimStatus,
    linkCopied,
    setLinkCopied,
    isAuthenticated,
    rewardLoading,
    claimLink,
    heardPointsAwarded,
    rewardIssued,
    hasTokenRewards,
    hasHeardPointsRewards,
    hasAnyRewards,
    hasCompletedSurvey,
    shouldShowErrorState,
    isCompletedNoReward,
    handleClaimReward,
    handleCopyClaimLink
  } = useRewardPage(survey, responseId)

  if (!isAuthenticated) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Authentication Required</h2>
          <p className="text-zinc-600 mb-4">Please connect your wallet to view your reward.</p>
          <Button onClick={onBackToSurveys}>Back to Surveys</Button>
        </div>
      </section>
    )
  }

  if (rewardLoading) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <LoadingState loading={true}>
            Loading reward information...
          </LoadingState>
        </div>
      </section>
    )
  }

  if (shouldShowErrorState) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">No Reward Available</h2>
          <p className="text-zinc-600 mb-4">
            You need to complete this survey first to receive your reward.
          </p>
          <Button onClick={onBackToSurveys}>Back to Surveys</Button>
        </div>
      </section>
    )
  }

  // If completed but no rewards available, show thank you message
  if (hasCompletedSurvey && (!hasAnyRewards || isCompletedNoReward)) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 mb-4">Thank You!</h2>
              <p className="text-base text-zinc-600">
                Thank you for completing the <strong>{survey.name}</strong> survey from {survey.company}.
                Your feedback is valuable to us!
              </p>
              {heardPointsAwarded > 0 && (
                <p className="text-sm text-zinc-500 mt-2">
                  You have earned <b>{formatNumber(heardPointsAwarded)} HEARD</b> points for completing this survey.
                </p>
              )}
            </div>

            <Button
              onClick={onBackToSurveys}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg py-3 text-base font-medium"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <RewardHeader survey={survey} />

          <RewardDetails
            survey={survey}
            claimLink={claimLink}
            heardPointsAwarded={heardPointsAwarded}
          />

          {qrCodeUrl && claimLink && (
            <ClaimSection
              survey={survey}
              qrCodeUrl={qrCodeUrl}
              claimLink={claimLink}
              linkCopied={linkCopied}
              setLinkCopied={setLinkCopied}
            />
          )}

          <RewardActions
            hasTokenRewards={hasTokenRewards}
            hasHeardPointsRewards={hasHeardPointsRewards}
            rewardIssued={rewardIssued}
            claimStatus={claimStatus}
            linkCopied={linkCopied}
            heardPointsAwarded={heardPointsAwarded}
            onClaimReward={handleClaimReward}
            onCopyClaimLink={handleCopyClaimLink}
            onBackToSurveys={onBackToSurveys}
          />
        </div>
      </div>
    </section>
  )
}
