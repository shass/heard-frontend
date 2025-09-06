import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle2, Copy, Check } from 'lucide-react'

interface RewardActionsProps {
  hasTokenRewards: boolean
  hasHeardPointsRewards: boolean
  rewardIssued: boolean
  claimStatus: 'pending' | 'claimed' | 'error'
  linkCopied: boolean
  heardPointsAwarded: number
  onClaimReward: () => void
  onCopyClaimLink: () => void
  onBackToSurveys: () => void
}

export function RewardActions({
  hasTokenRewards,
  hasHeardPointsRewards,
  rewardIssued,
  claimStatus,
  linkCopied,
  heardPointsAwarded,
  onClaimReward,
  onCopyClaimLink,
  onBackToSurveys
}: RewardActionsProps) {
  return (
    <div className="space-y-4">
      {hasTokenRewards && !rewardIssued && (
        <>
          <Button
            onClick={onClaimReward}
            disabled={claimStatus === 'claimed'}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg py-3 text-base font-medium"
          >
            {claimStatus === 'claimed' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Reward Claimed
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Claim Reward
              </>
            )}
          </Button>

          <Button
            onClick={onCopyClaimLink}
            variant="outline"
            className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg py-3 text-base font-medium bg-transparent"
          >
            {linkCopied ? (
              <Check className="w-4 h-4 mr-2 text-zinc-900" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copy Claim Link
          </Button>
        </>
      )}

      {!hasTokenRewards && hasHeardPointsRewards && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800">
            <strong>Reward Earned!</strong>
          </div>
          <p className="text-sm text-green-700 mt-1">
            You have earned <strong>{heardPointsAwarded} HeardPoints</strong> for completing this survey.
          </p>
        </div>
      )}

      {!hasTokenRewards && heardPointsAwarded === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800">
            <strong>Processing Reward...</strong>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Your reward is being processed. Please check back in a few minutes.
          </p>
        </div>
      )}

      <Button
        onClick={onBackToSurveys}
        variant="outline"
        className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg py-3 text-base font-medium bg-transparent"
      >
        Back to Home
      </Button>
    </div>
  )
}