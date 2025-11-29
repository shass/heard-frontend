"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-states"
import { Gift, Calendar } from "lucide-react"
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
    winnerStatus,
    winnerLoading,
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
    const isTimeLimited = survey.surveyType === 'time_limited'
    const endDateFormatted = survey.endDate
      ? new Intl.DateTimeFormat('en-US', {
          dateStyle: 'long',
          timeStyle: 'short'
        }).format(new Date(survey.endDate))
      : null

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

              {isTimeLimited ? (
                <div className="space-y-4 text-base text-zinc-700">
                  <p>Thanks for taking part in the prediction survey.</p>
                  {heardPointsAwarded > 0 && (
                    <p>
                      You have just earned <strong>{formatNumber(heardPointsAwarded)} Heard Points</strong>.
                    </p>
                  )}
                  {endDateFormatted && (
                    <p>
                      The final results will be announced on <strong>{endDateFormatted}</strong>.
                    </p>
                  )}
                  <p>
                    Participants who guessed the largest number of popular answers will share the prize pool.
                    A link to claim your reward will appear on this survey page.
                  </p>

                  <p>
                    Follow <a
                      href="https://x.com/Heard_labs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                      our X
                    </a> so you do not miss the event.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-base text-zinc-600">
                    Thank you for completing the <strong>{survey.name}</strong> survey from {survey.company}.
                    Your feedback is valuable to us!
                  </p>
                  {heardPointsAwarded > 0 && (
                    <p className="text-sm text-zinc-500 mt-2">
                      You have earned <b>{formatNumber(heardPointsAwarded)} HEARD</b> points for completing this survey.
                    </p>
                  )}
                </>
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
            winnerStatus={winnerStatus}
          />

          {survey.surveyType === 'time_limited' && survey.endDate && (
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  Survey End Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-zinc-700">
                  {new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  }).format(new Date(survey.endDate))}
                </p>
              </CardContent>
            </Card>
          )}

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
