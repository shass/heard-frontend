import { CheckCircle2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { Survey } from '@/lib/types'

interface RewardDetailsProps {
  survey: Survey
  claimLink?: string
  heardPointsAwarded: number
}

export function RewardDetails({
  survey,
  claimLink,
  heardPointsAwarded
}: RewardDetailsProps) {
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