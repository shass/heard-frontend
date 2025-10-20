'use client'

import { Suspense } from 'react'
import { SurveyResults, SurveyResultsSkeleton } from '@/components/survey-results'
import { useSurvey } from '@/hooks'
import { useOpenUrl } from '@/src/platforms/_core/hooks'

interface SurveyResultsPageProps {
  params: {
    id: string
  }
}

// Client component to handle the survey data fetching
function SurveyResultsContent({ surveyId }: { surveyId: string }) {
  const { data: survey } = useSurvey(surveyId)
  const openUrl = useOpenUrl()

  return (
    <SurveyResults
      surveyId={surveyId}
      surveyName={survey?.name}
      surveyCompany={survey?.company}
      onClaimReward={openUrl}
    />
  )
}

export default function SurveyResultsPage({ params }: SurveyResultsPageProps) {
  return (
    <Suspense fallback={<SurveyResultsSkeleton />}>
      <SurveyResultsContent surveyId={params.id} />
    </Suspense>
  )
}

