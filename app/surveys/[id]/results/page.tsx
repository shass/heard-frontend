'use client'

import { Suspense } from 'react'
import { SurveyResults, SurveyResultsSkeleton } from '@/components/survey-results/survey-results'
import { useSurvey } from '@/hooks/use-surveys'

interface SurveyResultsPageProps {
  params: {
    id: string
  }
}

// Client component to handle the survey data fetching
function SurveyResultsContent({ surveyId }: { surveyId: string }) {
  const { data: survey } = useSurvey(surveyId)
  
  return (
    <SurveyResults
      surveyId={surveyId}
      surveyName={survey?.name}
      surveyCompany={survey?.company}
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

