'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShareButton } from '@/components/share-button'
import { SurveyReward } from '@/components/survey'
import { Users, TrendingUp, Clock, Eye, EyeOff } from 'lucide-react'
import { useSurveyResultsWithQuestions, useCanViewResults, useUserReward } from '@/hooks'
import { useWallet, useOpenUrl } from '@/src/platforms/_core'
import { useAuthStore } from '@/lib/store'
import { resultsUtils } from '@/lib/api/survey-clients'
import { QuestionChart } from './question-chart'
import { VisibilityManager } from './visibility-manager'

interface SurveyResultsProps {
  surveyId: string
  surveyName?: string
  surveyCompany?: string
  onClaimReward?: (claimLink: string) => void
}

export function SurveyResults({
  surveyId,
  surveyName = 'Survey Results',
  surveyCompany,
  onClaimReward
}: SurveyResultsProps) {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const wallet = useWallet()
  const isConnected = wallet.isConnected
  const openUrl = useOpenUrl()

  const { canView, visibilityMode, isLoading: accessLoading } = useCanViewResults(surveyId, token || undefined)
  const {
    results,
    questions,
    isLoading,
    error,
    isError
  } = useSurveyResultsWithQuestions(surveyId, token || undefined)

  // Get user's reward if authenticated (backend auth required, not just wallet connection)
  const { data: userReward } = useUserReward(surveyId, isAuthenticated)

  const handleClaimReward = () => {
    if (userReward?.claimLink) {
      // Use provided handler or platform-specific URL strategy
      if (onClaimReward) {
        onClaimReward(userReward.claimLink)
      } else {
        openUrl(userReward.claimLink)
      }
    }
  }

  const handleCopyClaimLink = () => {
    if (userReward?.claimLink) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(userReward.claimLink)
      }
    }
  }

  // Access denied
  if (!accessLoading && !canView) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <EyeOff className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view these survey results.
            {visibilityMode === 'private' && (
              <span className="block mt-2 text-sm">
                This survey's results are private and only visible to administrators and survey clients.
              </span>
            )}
            {visibilityMode === 'link' && !token && (
              <span className="block mt-2 text-sm">
                This survey requires a special access link to view results.
              </span>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || accessLoading) {
    return <SurveyResultsSkeleton />
  }

  if (isError || !results || !questions || !Array.isArray(questions)) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Failed to load survey results. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { stats, responses } = results
  const chartColors = resultsUtils.generateChartColors(10)

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{surveyName}</h1>
          {surveyCompany && (
            <p className="text-muted-foreground">{surveyCompany}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {visibilityMode === 'public' && (
            <ShareButton
              text={`Check out these survey results from ${surveyCompany || 'Heard Labs'}: "${surveyName}"`}
              url={typeof window !== 'undefined' ? window.location.href : undefined}
              variant="outline"
              size="sm"
            />
          )}
          {visibilityMode && (
            <Badge variant={visibilityMode === 'public' ? 'default' : 'secondary'}>
              <Eye className="w-3 h-3 mr-1" />
              {visibilityMode === 'public' ? 'Public' :
               visibilityMode === 'link' ? 'Link Access' : 'Private'}
            </Badge>
          )}
        </div>
      </div>

      {/* Visibility Management (admin only) */}
      <VisibilityManager surveyId={surveyId} />

      {/* Reward Section */}
      {userReward?.claimLink && (
        <SurveyReward
          userReward={userReward}
          onClaimReward={handleClaimReward}
          onCopyClaimLink={handleCopyClaimLink}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedResponses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalResponses > 0
                ? Math.round((stats.completedResponses / stats.totalResponses) * 100)
                : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.incompleteResponses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageCompletionTime
                ? `${Math.round(stats.averageCompletionTime)}min`
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Results */}
      {stats.completedResponses > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Question Results</h2>

          {(Array.isArray(questions) ? questions : [])
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((question) => {
              const questionData = question.questionType === 'single'
                ? resultsUtils.processSingleChoiceData(question.id, question, responses)
                : resultsUtils.processMultipleChoiceData(question.id, question, responses)

              return (
                <QuestionChart
                  key={question.id}
                  question={question}
                  data={questionData}
                  colors={chartColors}
                  totalResponses={stats.completedResponses}
                />
              )
            })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No completed responses yet</h3>
              <p className="text-muted-foreground">
                Results will appear here once participants complete the survey.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SurveyResultsSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export { SurveyResultsSkeleton }
