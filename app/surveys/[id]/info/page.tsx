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
  const { login, isAuthenticated, isLoading: isAuthLoading, checkAuth } = useAuthActions()
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
    try {
      await login()

      if (eligibility?.isEligible) {
        router.push(`/surveys/${id}`)
      }

    } catch (error) {
      console.error('Authentication failed:', error)
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
