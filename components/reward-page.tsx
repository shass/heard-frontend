"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingState, InlineLoading } from "@/components/ui/loading-states"
import { Copy, ExternalLink, Gift, CheckCircle2 } from "lucide-react"
import { useUserReward } from "@/hooks/use-reward"
import { useHeardPoints } from "@/hooks/use-users"
import { useIsAuthenticated, useUser } from "@/lib/store"
import { useNotifications } from "@/components/ui/notifications"
import type { Survey } from "@/lib/types"

interface RewardPageProps {
  survey: Survey
  onBackToSurveys: () => void
  responseId?: string
}

export function RewardPage({ survey, onBackToSurveys, responseId }: RewardPageProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [claimStatus, setClaimStatus] = useState<'pending' | 'claimed' | 'error'>('pending')

  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const notifications = useNotifications()

  // Get user's reward for this survey (new LinkDrop system)
  const { data: userReward, isLoading: rewardLoading, error: rewardError } = useUserReward(survey.id)

  // Get updated user points
  const { data: userPoints, refetch: refetchPoints } = useHeardPoints()

  // Determine reward information (prioritize new system)
  const claimLink = userReward?.claimLink
  const linkDropCode = userReward?.linkDropCode
  const heardPointsAwarded = userReward?.heardPointsAwarded || 0
  const rewardClaimed = !!userReward?.usedAt
  const isNewLinkdropSystem = userReward?.type === 'linkdrop'

  // Generate QR code for LinkDrop claim
  useEffect(() => {
    let claimUrl = ''

    if (isNewLinkdropSystem && claimLink) {
      // New system: use direct claim link
      claimUrl = claimLink
    } else if (linkDropCode) {
      // Old system: generate claim URL
      claimUrl = `${window.location.origin}/claim/${linkDropCode}`
    }

    if (claimUrl) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(claimUrl)}`
      setQrCodeUrl(qrUrl)
    }
  }, [linkDropCode, claimLink, isNewLinkdropSystem])

  // Update claim status based on response
  useEffect(() => {
    if (rewardClaimed) {
      setClaimStatus('claimed')
    }
  }, [rewardClaimed])

  const handleClaimReward = async () => {
    let claimUrl = ''

    if (isNewLinkdropSystem && claimLink) {
      claimUrl = claimLink
    } else if (linkDropCode) {
      claimUrl = `${window.location.origin}/claim/${linkDropCode}`
    }

    if (!claimUrl) {
      notifications.error('No reward available', 'Claim link not found')
      return
    }

    try {
      // Open LinkDrop claim URL in new tab
      window.open(claimUrl, '_blank')

      // Mark as claimed (optimistically)
      setClaimStatus('claimed')

      // Refresh user points
      await refetchPoints()

      notifications.success('Reward claimed!', 'Your tokens have been transferred to your wallet')
    } catch (error: any) {
      setClaimStatus('error')
      notifications.error('Failed to claim reward', error.message)
    }
  }

  const handleCopyClaimLink = () => {
    let claimUrl = ''

    if (isNewLinkdropSystem && claimLink) {
      claimUrl = claimLink
    } else if (linkDropCode) {
      claimUrl = `${window.location.origin}/claim/${linkDropCode}`
    }

    if (claimUrl) {
      navigator.clipboard.writeText(claimUrl)
      notifications.success('Link copied', 'Claim link copied to clipboard')
    }
  }

  const formatReward = () => {
    const tokenReward = `${survey.rewardAmount} ${survey.rewardToken}`
    const pointsReward = heardPointsAwarded > 0 ? ` + ${heardPointsAwarded} HP` : ""
    return tokenReward + pointsReward
  }

  if (!isAuthenticated) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Authentication Required</h2>
          <p className="text-zinc-600 mb-4">Please connect your wallet to view your reward.</p>
          <Button onClick={onBackToSurveys}>Back to Home</Button>
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

  // Show error state ONLY if there's an actual error and no data
  // Note: responseState.response is always null (disabled in hook), so only check userReward
  const hasRewardData = !!userReward
  const shouldShowErrorState = !hasRewardData && !rewardLoading && rewardError

  if (shouldShowErrorState) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">No Reward Available</h2>
          <p className="text-zinc-600 mb-4">
            You need to complete this survey first to receive your reward.
          </p>
          <Button onClick={onBackToSurveys}>Back to Home</Button>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          {/* Header */}
          <div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">Survey Completed!</h2>
            <p className="text-base text-zinc-600">
              Thank you for completing the <strong>{survey.name}</strong> survey from {survey.company}.
            </p>
          </div>

          {/* Reward Details */}
          <div className="bg-zinc-50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium text-zinc-900">Your Reward</h3>
            <div className="text-2xl font-bold text-zinc-900">
              {formatReward()}
            </div>

            {heardPointsAwarded > 0 && (
              <div className="flex items-center justify-center space-x-2 text-sm text-zinc-600">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{heardPointsAwarded} HeardPoints have been added to your account</span>
              </div>
            )}
          </div>

          {/* QR Code */}
          {qrCodeUrl && (claimLink || linkDropCode) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-zinc-900">Claim Your Tokens</h3>
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white rounded-lg border-2 border-zinc-200 flex items-center justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for reward claim"
                    className="w-44 h-44"
                  />
                </div>
              </div>
              <p className="text-sm text-zinc-600">
                Scan this QR code or use the buttons below to claim your {survey.rewardAmount} {survey.rewardToken}
              </p>
              
              {/* Direct claim link */}
              {(claimLink || linkDropCode) && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="text-sm font-medium text-zinc-700 mb-2">Direct Claim Link:</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={claimLink || `${window.location.origin}/claim/${linkDropCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-600 hover:text-blue-800 underline break-all bg-white p-2 rounded border flex-1"
                    >
                      {claimLink || `${window.location.origin}/claim/${linkDropCode}`}
                    </a>
                    <button
                      onClick={() => {
                        const claimUrl = claimLink || `${window.location.origin}/claim/${linkDropCode}`
                        navigator.clipboard.writeText(claimUrl)
                        notifications.success('Link copied', 'Claim link copied to clipboard')
                      }}
                      className="p-2 bg-white border rounded hover:bg-gray-50 flex-shrink-0"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4 text-zinc-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {(claimLink || linkDropCode) && !rewardClaimed && (
              <>
                <Button
                  onClick={handleClaimReward}
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
                  onClick={handleCopyClaimLink}
                  variant="outline"
                  className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg py-3 text-base font-medium bg-transparent"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Claim Link
                </Button>
              </>
            )}

            {rewardClaimed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Reward Successfully Claimed!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your {survey.rewardAmount} {survey.rewardToken} has been transferred to your wallet.
                </p>
              </div>
            )}

            {!claimLink && !linkDropCode && (
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

          {/* Additional Info */}
          <div className="text-xs text-zinc-500 space-y-2">
            <p>
              Questions about your reward? Contact support at support@heardlabs.com
            </p>
            <p>
              Current HeardPoints Balance: {userPoints?.currentBalance || 0} HP
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
