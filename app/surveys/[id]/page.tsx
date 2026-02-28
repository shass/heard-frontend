"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SurveyPage } from "@/components/survey-page"
import { Footer } from "@/components/footer"
import { useSurvey, useSurveyEligibility } from "@/hooks/use-surveys"
import { useAuthStore } from "@/lib/store"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface SurveyDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const user = useAuthStore(state => state.user)

  // Read BringId params from sessionStorage (set by info page after verification)
  // Using useState to read once on mount, then clear to prevent reuse
  const [bringIdScore] = useState<number | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    const stored = sessionStorage.getItem(`bringid_score_${id}`)
    if (stored !== null) {
      sessionStorage.removeItem(`bringid_score_${id}`)
      const parsed = parseInt(stored, 10)
      return isNaN(parsed) ? undefined : parsed
    }
    return undefined
  })
  const [bringIdPoints] = useState<number | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    const stored = sessionStorage.getItem(`bringid_points_${id}`)
    if (stored !== null) {
      sessionStorage.removeItem(`bringid_points_${id}`)
      const parsed = parseInt(stored, 10)
      return isNaN(parsed) ? undefined : parsed
    }
    return undefined
  })

  const { data: survey, isLoading, error } = useSurvey(id)

  // Use the API-based eligibility hook that accepts BringId params
  const { data: eligibility, isLoading: accessLoading } = useSurveyEligibility(
    id,
    user?.walletAddress,
    survey,
    bringIdScore,
    bringIdPoints
  )

  const isEligible = eligibility?.isEligible ?? null

  const hasRedirectedRef = useRef(false)

  // Redirect to info page if not eligible (all validations happen there)
  useEffect(() => {
    if (isEligible === false && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      router.replace(`/surveys/${id}/info`)
    }
  }, [isEligible, router, id])

  const handleSubmitSurvey = (submittedResponseId?: string) => {
    // Navigate to reward page with responseId as query parameter
    const rewardUrl = submittedResponseId
      ? `/surveys/${id}/reward?responseId=${submittedResponseId}`
      : `/surveys/${id}/reward`
    router.push(rewardUrl)
  }

  const handleBackToSurveys = () => {
    router.push("/")
  }

  // Show loading state while fetching survey or checking access
  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
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
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <Button
                variant="ghost"
                onClick={handleBackToSurveys}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>

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

  // Show loading while redirecting to info page
  if (isEligible === false) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-3/4" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        <SurveyPage
          survey={survey}
          onSubmit={handleSubmitSurvey}
          onBack={handleBackToSurveys}
        />
      </main>

      <Footer />
    </div>
  )
}
