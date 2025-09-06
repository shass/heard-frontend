import { useState, useEffect } from 'react'
import { useOpenUrl } from '@coinbase/onchainkit/minikit'
import { useUserReward } from '@/hooks/use-reward'
import { useHeardPoints } from '@/hooks/use-users'
import { useIsAuthenticated, useUser } from '@/lib/store'
import { useNotifications } from '@/components/ui/notifications'
import type { Survey } from '@/lib/types'

type ClaimStatus = 'pending' | 'claimed' | 'error'

export function useRewardPage(survey: Survey, responseId?: string) {
  const openUrl = useOpenUrl()
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('pending')
  const [linkCopied, setLinkCopied] = useState(false)

  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const notifications = useNotifications()

  // Get user's reward for this survey
  const { data: userReward, isLoading: rewardLoading, error: rewardError } = useUserReward(survey.id)

  // Get updated user points
  const { data: userPoints, refetch: refetchPoints } = useHeardPoints()

  // Compute reward information
  const claimLink = userReward?.claimLink
  const heardPointsAwarded = userReward?.heardPointsAwarded || survey.heardPointsReward || 0
  const rewardIssued = !!userReward?.usedAt
  const isLinkdropReward = userReward?.type === 'linkdrop'
  const isCompletedNoReward = userReward?.type === 'completed_no_reward'

  // Check if there are any rewards available
  const hasTokenRewards = !!claimLink
  const hasHeardPointsRewards = !!userReward?.heardPointsAwarded && userReward.heardPointsAwarded > 0
  const hasAnyRewards = hasTokenRewards || hasHeardPointsRewards
  
  const hasCompletedSurvey = !!responseId || !!userReward
  const shouldShowErrorState = !hasCompletedSurvey && !rewardLoading

  // Generate QR code for LinkDrop claim
  useEffect(() => {
    if (claimLink) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(claimLink)}`
      setQrCodeUrl(qrUrl)
    }
  }, [claimLink])

  // Update claim status based on response
  useEffect(() => {
    if (rewardIssued) {
      setClaimStatus('claimed')
    }
  }, [rewardIssued])

  const handleClaimReward = async () => {
    if (!claimLink) {
      notifications.error('No reward available', 'Claim link not found')
      return
    }

    try {
      openUrl(claimLink)
      setClaimStatus('claimed')
      await refetchPoints()
      notifications.success('Reward claimed!', 'Your tokens have been transferred to your wallet')
    } catch (error: any) {
      setClaimStatus('error')
      notifications.error('Failed to claim reward', error.message)
    }
  }

  const handleCopyClaimLink = () => {
    if (claimLink) {
      navigator.clipboard.writeText(claimLink)
      notifications.success('Link copied', 'Claim link copied to clipboard')
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    }
  }

  return {
    // State
    qrCodeUrl,
    claimStatus,
    linkCopied,
    setLinkCopied,
    
    // User data
    user,
    isAuthenticated,
    
    // Reward data
    userReward,
    rewardLoading,
    rewardError,
    claimLink,
    heardPointsAwarded,
    rewardIssued,
    isLinkdropReward,
    isCompletedNoReward,
    
    // Computed values
    hasTokenRewards,
    hasHeardPointsRewards,
    hasAnyRewards,
    hasCompletedSurvey,
    shouldShowErrorState,
    
    // Actions
    handleClaimReward,
    handleCopyClaimLink
  }
}