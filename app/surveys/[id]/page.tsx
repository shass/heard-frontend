"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { SurveyPage } from "@/components/survey-page"
import { Footer } from "@/components/footer"
import { useSurvey } from "@/hooks/use-surveys"
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
  
  const { data: survey, isLoading, error } = useSurvey(id)

  const handleSubmitSurvey = (submittedResponseId?: string) => {
    // Navigate to reward page with responseId as query parameter
    const rewardUrl = submittedResponseId 
      ? `/surveys/${id}/reward?responseId=${submittedResponseId}`
      : `/surveys/${id}/reward`
    router.push(rewardUrl)
  }

  const handleBackToSurveys = () => {
    router.push("/surveys")
  }

  if (isLoading) {
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
                Back to Surveys
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