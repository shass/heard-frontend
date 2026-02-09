"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useSurvey, useSurveyEligibility, useUserReward, useWinnerStatus, useSurveyStrategy } from "@/hooks"
import { useHumanityVerification } from "@/hooks/use-humanity-verification"
import { usePlatform } from "@/src/core/hooks/usePlatform"
import { useAuth, useWallet, useOpenUrl } from "@/src/platforms/_core"
import { Platform } from "@/src/platforms/config"
import { RewardSource } from "@/lib/survey/strategies"
import { resolveSurveyButtonPhase, getButtonConfig } from '@/lib/survey/button-state-machine'
import type { SurveyButtonHandlers } from '@/lib/survey/button-state-machine'
import { useAuthStore } from "@/lib/store"
import { bringid } from "@/lib/bringid"
import {
  SurveyHeader,
  SurveyStats,
  SurveyInfo,
  SurveyActionButton,
  SurveyReward,
  PredictionSurveyInfo
} from "@/components/survey"

interface SurveyInfoPageProps {
  params: Promise<{
    id: string
  }>
}

// Hook to safely use RainbowKit only on Web platform
const useWebConnectModal = () => {
  const { platform: platformPlugin } = usePlatform()
  const platform = platformPlugin?.id as Platform | undefined

  if (platform === Platform.WEB) {
    const { useConnectModal } = require('@rainbow-me/rainbowkit')
    return useConnectModal()
  }

  return { openConnectModal: undefined }
}

export default function SurveyInfoPage({ params }: SurveyInfoPageProps) {
  const router = useRouter()
  const openUrl = useOpenUrl()
  const auth = useAuth()
  const wallet = useWallet()

  // Read all auth state from store (strategy is stateless)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const user = useAuthStore(state => state.user)
  const isAuthLoading = useAuthStore(state => state.loading)

  // Wallet connection is handled by platform-specific strategies
  const isConnected = wallet.isConnected
  const address = wallet.address || user?.walletAddress || null

  const { openConnectModal } = useWebConnectModal()
  const { id } = use(params)

  // Note: checkAuth is handled by auth strategies internally

  const { data: survey, isLoading, error } = useSurvey(id)

  // BringId score (on-chain reputation) and points (from humanity verification)
  const [bringIdScore, setBringIdScore] = useState<number | undefined>(undefined)
  const [bringIdPoints, setBringIdPoints] = useState<number | undefined>(undefined)

  // Check if survey uses BringId strategy
  const hasBringIdStrategy = survey?.accessStrategyIds?.includes('bringid') ?? false

  // Fetch BringId score on load if survey has bringid strategy
  useEffect(() => {
    if (!hasBringIdStrategy || !address) return

    let cancelled = false

    const fetchScore = async () => {
      try {
        const result = await bringid.getAddressScore(address)
        if (!cancelled) {
          setBringIdScore(result.score)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SurveyInfo] Failed to fetch BringId score:', error)
        }
      }
    }

    fetchScore()

    return () => { cancelled = true }
  }, [hasBringIdStrategy, address])

  const { data: eligibility, refetch: refetchEligibility, isFetching: isEligibilityFetching } = useSurveyEligibility(id, address ?? undefined, survey, bringIdScore, bringIdPoints)

  // BringId verification
  const { verify: verifyHumanity, isVerifying: isBringIdVerifying } = useHumanityVerification()
  // Reward is fetched only if user is authenticated (connected state is not required)
  const { data: userReward } = useUserReward(id, isAuthenticated)

  // Get strategy for the survey type
  const strategy = useSurveyStrategy(survey)

  // Get winner status if needed based on survey strategy
  const rewardSource = strategy?.getRewardSource()
  const shouldFetchWinnerStatus = rewardSource === RewardSource.WINNER_STATUS || rewardSource === RewardSource.BOTH
  const { data: winnerStatus, isLoading: isWinnerLoading, error: winnerError } = useWinnerStatus(
    shouldFetchWinnerStatus ? id : undefined
  )

  const handleStartSurvey = () => {
    // Pass BringId params to survey page to preserve verification state
    const params = new URLSearchParams()
    if (bringIdScore !== undefined) {
      params.set('bringIdScore', String(bringIdScore))
    }
    if (bringIdPoints !== undefined) {
      params.set('bringIdPoints', String(bringIdPoints))
    }
    const queryString = params.toString()
    router.push(`/surveys/${id}${queryString ? `?${queryString}` : ''}`)
  }

  const handleConnectWallet = () => {
    if (openConnectModal) {
      openConnectModal()
    }
  }

  const handleAuthenticate = async () => {
    try {
      const result = await auth.authenticate()
      if (result?.success) {
        // Refetch eligibility with fresh auth state
        const { data: freshEligibility } = await refetchEligibility()

        if (freshEligibility?.hasCompleted) {
          console.log('[Survey] ✅ User authenticated, staying on info page to show results')
        } else if (freshEligibility?.isEligible !== false) {
          handleStartSurvey()
        } else {
          console.log('[Survey] ⚠️ User authenticated but not eligible for this survey')
        }
      } else {
        console.log('[Survey] ❌ Authentication failed or cancelled')
      }
    } catch (error: any) {
      console.error('[Survey] ❌ Authentication failed:', error)
    }
  }

  const handleBackToSurveys = () => {
    router.push("/")
  }

  const handleVerifyBringId = async () => {
    if (!address) return
    try {
      const result = await verifyHumanity(address)
      if (result?.verified && result.points !== undefined) {
        // Save points and trigger eligibility re-check (via queryKey change)
        setBringIdPoints(result.points)
      }
    } catch (error) {
      console.error('[Survey] BringId verification failed:', error)
    }
  }

  const handleClaimReward = () => {
    const claimLink = strategy?.getClaimLink({ survey: survey!, userReward, winnerStatus })
    if (claimLink) {
      openUrl(claimLink)
    }
  }

  const handleCopyClaimLink = () => {
    const claimLink = strategy?.getClaimLink({ survey: survey!, userReward, winnerStatus })
    if (claimLink) {
      navigator.clipboard.writeText(claimLink)
      // TODO: Add notification
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <SurveyHeader
                survey={{ name: 'Survey', company: '', description: '', isActive: false } as any}
                onBack={handleBackToSurveys}
                variant="info"
              />

              <Alert variant="destructive">
                <AlertDescription>
                  {error?.message || "Survey not found. Please check the URL and try again."}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const hasCompleted = eligibility?.hasCompleted

  // Handlers for button actions
  const buttonHandlers: SurveyButtonHandlers = {
    onStart: handleStartSurvey,
    onConnect: handleConnectWallet,
    onAuthenticate: handleAuthenticate,
    onVerifyBringId: handleVerifyBringId,
  }

  // Resolve button phase via state machine
  const buttonPhase = resolveSurveyButtonPhase({
    surveyLoaded: !!survey,
    surveyType: survey!.surveyType,
    startDate: survey!.startDate,
    endDate: survey!.endDate,
    eligibility: eligibility ? {
      isEligible: eligibility.isEligible,
      hasStarted: eligibility.hasStarted,
      hasCompleted: eligibility.hasCompleted,
      accessStrategies: eligibility.accessStrategies,
    } : undefined,
    isEligibilityFetching,
    isConnected,
    hasAddress: !!address,
    isAuthenticated,
    isAuthLoading,
    isBringIdVerifying,
  })

  const buttonState = getButtonConfig(buttonPhase, buttonHandlers)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Header with Back Button */}
            <SurveyHeader
              survey={survey}
              onBack={handleBackToSurveys}
              variant="info"
            />

            {/* Survey Stats */}
            <SurveyStats survey={survey} strategy={strategy} />

            {/* Prediction Survey Info */}
            <PredictionSurveyInfo survey={survey} strategy={strategy} />

            {/* Survey Information */}
            <SurveyInfo survey={survey} eligibility={eligibility} isEligibilityLoading={isEligibilityFetching && !!address} isConnected={isConnected} requiresVerification={buttonPhase === 'verify_bringid' || buttonPhase === 'verifying_bringid'} />

            {/* Reward Section */}
            {hasCompleted && userReward && (
              <SurveyReward
                userReward={userReward}
                survey={survey}
                strategy={strategy}
                winnerStatus={winnerStatus}
                isWinnerLoading={isWinnerLoading}
                winnerError={winnerError}
                onClaimReward={handleClaimReward}
                onCopyClaimLink={handleCopyClaimLink}
              />
            )}

            {/* Action Button */}
            <SurveyActionButton buttonState={buttonState} phase={buttonPhase} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
