"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOpenUrl } from '@coinbase/onchainkit/minikit'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useSurvey, useSurveyEligibility } from "@/hooks/use-surveys"
import { useUserReward } from "@/hooks/use-reward"
import { useAuthActions } from "@/components/providers/auth-provider"
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  SurveyHeader,
  SurveyStats,
  SurveyInfo,
  SurveyActionButton,
  SurveyReward
} from "@/components/survey"

interface SurveyInfoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function SurveyInfoPage({ params }: SurveyInfoPageProps) {
  const router = useRouter()
  const openUrl = useOpenUrl()
  const { login, isAuthenticated, isLoading: isAuthLoading, checkAuth, user, error: authError } = useAuthActions()
  const { isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { id } = use(params)

  // Force auth check on component mount to ensure localStorage state is synced with server
  useEffect(() => {
    checkAuth().then()
  }, [])

  const { data: survey, isLoading, error } = useSurvey(id)
  const { data: eligibility } = useSurveyEligibility(id, address)
  const { data: userReward } = useUserReward(id)

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
      await login()

      console.log('[Survey] ✅ login() completed, checking auth state')

      // Force auth check to ensure state is synced
      console.log('[Survey] 🔍 Calling checkAuth()...')
      const authCheckResult = await checkAuth()
      console.log('[Survey] checkAuth result:', authCheckResult)

      // Wait a bit for all state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('[Survey] 📊 Auth state after login:', {
        isAuthenticated,
        authCheckResult,
        user: !!user,
        authError
      })

      // Check if authentication was successful before proceeding
      const finalAuthCheck = await checkAuth()
      console.log('[Survey] 🔍 Final auth check:', finalAuthCheck)

      if (isAuthenticated || finalAuthCheck) {
        console.log('[Survey] ✅ User authenticated successfully')

        // Wait for eligibility check to update
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (eligibility?.isEligible !== false) {
          console.log('[Survey] ✅ User eligible or eligibility unknown, navigating to survey')
          router.push(`/surveys/${id}`)
        } else {
          console.log('[Survey] ⚠️ User authenticated but not eligible for this survey')
          // UI will update to show "Not Eligible" button
        }
      } else {
        console.log('[Survey] ❌ Authentication completed but user not authenticated')
        console.log('[Survey] This might happen if user cancelled the signature')
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

            {/* Survey Information */}
            <SurveyInfo survey={survey} eligibility={eligibility} />

            {/* Reward Section */}
            {hasCompleted && userReward?.claimLink && (
              <SurveyReward
                userReward={userReward}
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
