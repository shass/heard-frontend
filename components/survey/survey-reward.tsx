"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, CheckCircle2, Trophy, XCircle } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { Survey, WinnerStatus, LinkdropReward } from "@/lib/types"
import type { ISurveyStrategy } from "@/lib/survey/strategies"

interface SurveyRewardProps {
  userReward: LinkdropReward
  survey?: Survey
  strategy?: ISurveyStrategy | null
  winnerStatus?: WinnerStatus
  isWinnerLoading?: boolean
  winnerError?: any
  onClaimReward: () => void
  onCopyClaimLink: () => void
}

export function SurveyReward({
  userReward,
  survey,
  strategy,
  winnerStatus,
  isWinnerLoading,
  winnerError,
  onClaimReward,
  onCopyClaimLink
}: SurveyRewardProps) {
  // Use strategy to get claim link
  const claimLink = survey && strategy?.getClaimLink({ survey, userReward, winnerStatus })
  const hasClaimLink = !!claimLink

  // Use strategy to determine if we should show winner info
  const shouldShowWinnerInfo = survey && strategy?.shouldShowWinnerInfo({ survey, userReward, winnerStatus })

  // Use strategy to determine if we should show token reward info
  const infoConfig = survey && strategy?.getInfoConfig(survey)
  const showTokenReward = infoConfig?.showTokenReward ?? true

  // Format end date for surveys that need it
  const endDateFormatted = survey?.endDate
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      }).format(new Date(survey.endDate))
    : null

  // Check if survey has ended
  const surveyHasEnded = survey?.endDate ? new Date() >= new Date(survey.endDate) : false

  // Determine if we should show "waiting for results" message
  // Show this if winner info should be shown but survey hasn't ended OR winners not announced yet
  const showWaitingMessage = shouldShowWinnerInfo && (!surveyHasEnded || isWinnerLoading || winnerError || !winnerStatus)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reward</CardTitle>
        <CardDescription>
          {shouldShowWinnerInfo
            ? "Thank you for participating in this prediction survey!"
            : "Congratulations! You have completed this survey and earned your reward."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Time Limited Survey - Show completion message if survey not ended or no winners file */}
          {showWaitingMessage ? (
            <div className="space-y-4 text-sm text-zinc-700">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Survey Completed!</span>
                </div>
                {(userReward.heardPointsAwarded > 0 || survey?.heardPointsReward) && (
                  <p className="text-sm text-green-700">
                    HeardPoints Earned: {formatNumber(userReward.heardPointsAwarded || survey?.heardPointsReward || 0)} HP
                  </p>
                )}
              </div>

              <p>Thanks for taking part in the prediction survey.</p>
              {(userReward.heardPointsAwarded > 0 || survey?.heardPointsReward) && (
                <p>
                  You have just earned <strong>{formatNumber(userReward.heardPointsAwarded || survey?.heardPointsReward || 0)} Heard Points</strong>.
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
          ) : shouldShowWinnerInfo && winnerStatus?.isWinner ? (
            // Winner announcement - User is a winner
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Congratulations! You're a winner!</span>
                </div>
                <div className="text-sm text-green-700">
                  {userReward.heardPointsAwarded > 0 && (
                    <p>HeardPoints Earned: {formatNumber(userReward.heardPointsAwarded)} HP</p>
                  )}
                  {winnerStatus.reward?.rewardType && (
                    <p>Prize: {winnerStatus.reward.rewardType}{winnerStatus.reward.place && ` (Place #${winnerStatus.reward.place})`}</p>
                  )}
                </div>
              </div>

              {claimLink && (
                <div className="space-y-3">
                  <div className="text-sm text-zinc-600">
                    Use the link below to claim your reward:
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={onClaimReward}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Claim Reward
                    </Button>

                    <Button
                      onClick={onCopyClaimLink}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : shouldShowWinnerInfo && !winnerStatus?.isWinner ? (
            // Winner announcement - User is not a winner
            <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-zinc-500" />
                <span className="font-medium text-zinc-700">Unfortunately, you didn't win this time.</span>
              </div>
              {userReward.heardPointsAwarded > 0 && (
                <p className="text-sm text-zinc-600 mt-2">
                  HeardPoints Earned: {formatNumber(userReward.heardPointsAwarded)} HP
                </p>
              )}
              <p className="text-sm text-zinc-600 mt-2">
                Better luck next time!
              </p>
            </div>
          ) : (
            // Standard surveys - original logic
            <>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Survey Completed!</span>
                </div>
                <div className="text-sm text-green-700">
                  {showTokenReward && (
                    <p>Token Reward: {formatNumber(userReward.survey?.rewardAmount || 0)} {userReward.survey?.rewardToken}</p>
                  )}
                  <p>HeardPoints Earned: {formatNumber(userReward.heardPointsAwarded)} HP</p>
                  {userReward.usedAt && (
                    <p>Reward given: {new Date(userReward.usedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {/* Claim Actions - only show if claim link is available */}
              {hasClaimLink && (
                <div className="space-y-3">
                  <div className="text-sm text-zinc-600">
                    {showTokenReward
                      ? `Use the link below to claim your ${formatNumber(userReward.survey?.rewardAmount || 0)} ${userReward.survey?.rewardToken} tokens:`
                      : 'Use the link below to claim your reward:'}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={onClaimReward}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Claim Reward
                    </Button>

                    <Button
                      onClick={onCopyClaimLink}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* QR Code */}
                  <div className="text-center">
                    <div className="inline-block p-2 bg-white rounded-lg border">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(userReward.claimLink!)}`}
                        alt="QR Code for reward claim"
                        className="w-30 h-30"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Scan with your wallet app</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}