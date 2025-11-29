import { CheckCircle2, Trophy, XCircle } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { SurveyType, type Survey, type WinnerStatus } from '@/lib/types'

interface RewardDetailsProps {
  survey: Survey
  claimLink?: string
  heardPointsAwarded: number
  winnerStatus?: WinnerStatus
}

export function RewardDetails({
  survey,
  claimLink,
  heardPointsAwarded,
  winnerStatus
}: RewardDetailsProps) {
  // Handle time_limited surveys differently
  if (survey.surveyType === SurveyType.TIME_LIMITED) {
    return (
      <div className="bg-zinc-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-medium text-zinc-900">Your Reward</h3>

        {/* HeardPoints display */}
        {heardPointsAwarded > 0 && (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-zinc-900">
              {heardPointsAwarded} HeardPoints
            </div>
            <div className="flex items-center space-x-2 text-sm text-zinc-600">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>HeardPoints have been added to your account</span>
            </div>
          </div>
        )}

        {/* Winner status display */}
        {winnerStatus === undefined ? (
          // No winners file uploaded yet
          <div className="text-zinc-600 text-sm mt-4">
            <p>Thank you for completing this survey!</p>
            <p className="mt-2">Winners will be announced soon. Check back later to see if you won!</p>
          </div>
        ) : winnerStatus.isWinner ? (
          // User is a winner
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2 text-green-600">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Congratulations! You're a winner!</span>
            </div>
            {winnerStatus.reward?.rewardType && (
              <p className="text-sm text-zinc-600">
                Prize: {winnerStatus.reward.rewardType}
                {winnerStatus.reward.place && ` (Place #${winnerStatus.reward.place})`}
              </p>
            )}
          </div>
        ) : (
          // User is not a winner
          <div className="mt-4 flex items-center space-x-2 text-zinc-500">
            <XCircle className="w-5 h-5" />
            <span>Unfortunately, you didn't win this time. Better luck next time!</span>
          </div>
        )}
      </div>
    )
  }

  // Standard surveys - original logic
  const formatReward = () => {
    if (claimLink) {
      return `${formatNumber(survey.rewardAmount)} ${survey.rewardToken}`
    }

    if (heardPointsAwarded > 0) {
      return `${heardPointsAwarded} HeardPoints`
    }

    return `${formatNumber(survey.rewardAmount)} ${survey.rewardToken}`
  }

  return (
    <div className="bg-zinc-50 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-medium text-zinc-900">Your Reward</h3>
      <div className="text-2xl font-bold text-zinc-900">
        {formatReward()}
      </div>

      {heardPointsAwarded > 0 && claimLink && (
        <div className="flex items-center justify-center space-x-2 text-sm text-zinc-600">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{heardPointsAwarded} HeardPoints have been added to your account</span>
        </div>
      )}
    </div>
  )
}