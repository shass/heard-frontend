"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useSurvey, useSurveyEligibility, useUserReward, useWinnerStatus } from "@/hooks"
import { usePlatformDetector } from "@/src/platforms"
import { useAuth, useWallet, useOpenUrl } from "@/src/platforms/_core"
import { Platform } from "@/src/platforms/config"
import { SurveyType } from "@/lib/types"
import {
  SurveyHeader,
  SurveyStats,
  SurveyInfo,
  SurveyActionButton,
  SurveyReward,
  TimeLimitedInfo,
  WinnerReward
} from "@/components/survey"

interface SurveyInfoPageProps {
  params: Promise<{
    id: string
  }>
}

// Hook to safely use RainbowKit only on Web platform
const useWebConnectModal = () => {
  const { platform } = usePlatformDetector()

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
  const { authenticate: login, isAuthenticated, isLoading: isAuthLoading, user, error: authError } = auth
  const wallet = useWallet()

  // Wallet connection is handled by platform-specific strategies
  const isConnected = wallet.isConnected
  const address = wallet.address || user?.walletAddress || null

  const { openConnectModal } = useWebConnectModal()
  const { id } = use(params)

  // Note: checkAuth is handled by auth strategies internally

  const { data: survey, isLoading, error } = useSurvey(id)
  const { data: eligibility } = useSurveyEligibility(id, address ?? undefined)
  // Reward is fetched only if user is authenticated (connected state is not required)
  const { data: userReward } = useUserReward(id, isAuthenticated)
  // Get winner status for time_limited surveys
  const { data: winnerStatus, isLoading: isWinnerLoading, error: winnerError } = useWinnerStatus(
    survey?.surveyType === SurveyType.TIME_LIMITED ? id : undefined
  )

  const handleStartSurvey = () => {
    router.push(`/surveys/${id}`)
  }

  const handleConnectWallet = () => {
    if (openConnectModal) {
      openConnectModal()
    }
  }

  const handleAuthenticate = async () => {
    console.log('[Survey] 🚀 handleAuthenticate called')
    console.log('[Survey] Current state:', {
      isAuthenticated,
      isAuthLoading,
      address,
      isConnected,
      authError: authError || 'None'
    })

    try {
      console.log('[Survey] 🔄 Calling login()...')
      const result = await login()

      console.log('[Survey] ✅ login() completed, result:', result)

      // Check result directly instead of waiting for state updates
      if (result?.success) {
        console.log('[Survey] ✅ User authenticated successfully')

        // Check eligibility before redirecting
        if (eligibility?.isEligible !== false) {
          console.log('[Survey] ✅ User eligible or eligibility unknown, redirecting to survey...')
          router.push(`/surveys/${id}`)
        } else {
          console.log('[Survey] ⚠️ User authenticated but not eligible for this survey')
          // UI will update to show "Not Eligible" button
        }
      } else {
        console.log('[Survey] ❌ Authentication failed or cancelled')
      }

    } catch (error: any) {
      console.error('[Survey] ❌ Authentication failed:', error)
      console.error('[Survey] Error details:', {
        message: error?.message || 'No message',
        stack: error?.stack || 'No stack',
        type: error?.constructor?.name || typeof error,
        fullError: error
      })

      // Try to extract more meaningful error information
      if (error && typeof error === 'object') {
        console.error('[Survey] Error object keys:', Object.keys(error))
        console.error('[Survey] Error stringified:', JSON.stringify(error, null, 2))
      }
    }
  }

  const handleBackToSurveys = () => {
    router.push("/")
  }

  const handleClaimReward = () => {
    if (userReward?.claimLink) {
      openUrl(userReward.claimLink)
    }
  }

  const handleCopyClaimLink = () => {
    if (userReward?.claimLink) {
      navigator.clipboard.writeText(userReward.claimLink)
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
  const isEligible = eligibility?.isEligible ?? true

  // Determine button state based on wallet connection and authentication
  const getButtonState = () => {
    if (hasCompleted) {
      return { text: "Survey Completed", disabled: true, handler: () => {}, loading: false }
    }

    if (!isConnected) {
      return { text: "Connect Wallet", disabled: false, handler: handleConnectWallet, loading: false }
    }

    if (!isEligible) {
      return { text: "Not Eligible", disabled: true, handler: () => {}, loading: false }
    }

    // Check time limits for time_limited surveys
    if (survey.surveyType === SurveyType.TIME_LIMITED) {
      const now = new Date()
      const startDate = survey.startDate ? new Date(survey.startDate) : null
      const endDate = survey.endDate ? new Date(survey.endDate) : null

      if (startDate && now < startDate) {
        return { text: "Survey Not Started Yet", disabled: true, handler: () => {}, loading: false }
      }

      if (endDate && now >= endDate) {
        return { text: "Survey Ended", disabled: true, handler: () => {}, loading: false }
      }
    }

    if (!isAuthenticated) {
      return {
        text: isAuthLoading ? "Authenticating..." : "Authorize & Start Survey",
        disabled: isAuthLoading,
        handler: handleAuthenticate,
        loading: isAuthLoading
      }
    }

    return { text: "Start Survey", disabled: false, handler: handleStartSurvey, loading: false }
  }

  const buttonState = getButtonState()

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
            <SurveyStats survey={survey} />

            {/* Time-Limited Survey Info */}
            <TimeLimitedInfo survey={survey} />

            {/* Survey Information */}
            <SurveyInfo survey={survey} eligibility={eligibility} />

            {/* Winner Reward removed as per new requirements - winners shown in reward section */}

            {/* Reward Section */}
            {hasCompleted && userReward && (
              <SurveyReward
                userReward={userReward}
                survey={survey}
                winnerStatus={winnerStatus}
                isWinnerLoading={isWinnerLoading}
                winnerError={winnerError}
                onClaimReward={handleClaimReward}
                onCopyClaimLink={handleCopyClaimLink}
              />
            )}

            {/* Action Button */}
            <SurveyActionButton buttonState={buttonState} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
