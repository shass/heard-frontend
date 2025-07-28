"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SurveyPageWrapper } from "@/components/cache-warming-wrapper"
import { useSurvey, useSurveyEligibility } from "@/hooks/use-surveys"
import { useUserReward } from "@/hooks/use-reward"
import { useUser, useIsAuthenticated } from "@/lib/store"
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
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const { isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { login } = useAuthActions()
  const { id } = use(params)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

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
      setIsAuthenticating(true)
      await login()

      if (eligibility?.isEligible) {
        router.push(`/surveys/${id}`)
      } else {
        setIsAuthenticating(false)
      }

    } catch (error) {
      console.error('Authentication failed:', error)
      setIsAuthenticating(false)
    }
  }

  const handleBackToSurveys = () => {
    router.push("/")
  }

  const handleClaimReward = () => {
    if (userReward?.claimLink) {
      window.open(userReward.claimLink, '_blank')
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
        text: isAuthenticating ? "Authenticating..." : "Authenticate & Start Survey",
        disabled: isAuthenticating,
        handler: handleAuthenticate,
        loading: isAuthenticating
      }
    }

    return { text: "Start Survey", disabled: false, handler: handleStartSurvey, loading: false }
  }

  const buttonState = getButtonState()

  return (
    <SurveyPageWrapper surveyId={id}>
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
    </SurveyPageWrapper>
  )
}
