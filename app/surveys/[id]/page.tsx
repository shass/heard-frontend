"use client"

import { use, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SurveyPage } from "@/components/survey-page"
import { Footer } from "@/components/footer"
import { useSurvey, useSurveyEligibility } from "@/hooks/use-surveys"
import { useAuth } from "@/src/platforms/_core/hooks/useAuth"
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
  const searchParams = useSearchParams()
  const { id } = use(params)
  const { user } = useAuth()

  // Read BringId params from URL (passed from info page after verification)
  const bringIdScoreParam = searchParams.get('bringIdScore')
  const bringIdPointsParam = searchParams.get('bringIdPoints')
  const bringIdScore = bringIdScoreParam ? parseInt(bringIdScoreParam, 10) : undefined
  const bringIdPoints = bringIdPointsParam ? parseInt(bringIdPointsParam, 10) : undefined

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

  // Redirect to info page if not eligible (all validations happen there)
  useEffect(() => {
    if (isEligible === false) {
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
