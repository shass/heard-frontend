"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SurveyPageWrapper } from "@/components/cache-warming-wrapper"
import { useSurvey, useSurveyEligibility } from "@/hooks/use-surveys"
import { useUserReward } from "@/hooks/use-reward"
import { useUser } from "@/lib/store"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Clock, Users, Gift, Star, ExternalLink, Copy, CheckCircle2 } from "lucide-react"

interface SurveyInfoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function SurveyInfoPage({ params }: SurveyInfoPageProps) {
  const router = useRouter()
  const user = useUser()
  const { id } = use(params)

  const { data: survey, isLoading, error } = useSurvey(id)
  const { data: eligibility } = useSurveyEligibility(id, user?.walletAddress)
  const { data: userReward } = useUserReward(id)

  const handleStartSurvey = () => {
    router.push(`/surveys/${id}`)
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

  const canTakeSurvey = eligibility?.isEligible && !eligibility?.hasCompleted
  const hasCompleted = eligibility?.hasCompleted

  return (
    <SurveyPageWrapper surveyId={id}>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={handleBackToSurveys}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Surveys
            </Button>

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-zinc-900">{survey.name}</h1>
                  <p className="text-xl text-zinc-600">{survey.company}</p>
                </div>
                <Badge variant={survey.isActive ? "default" : "secondary"}>
                  {survey.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="text-lg text-zinc-700">{survey.description}</p>
            </div>

            {/* Survey Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center p-4">
                  <Clock className="w-5 h-5 text-zinc-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{survey.totalQuestions}</p>
                    <p className="text-xs text-zinc-500">Questions</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-4">
                  <Users className="w-5 h-5 text-zinc-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{survey.responseCount}</p>
                    <p className="text-xs text-zinc-500">Responses</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-4">
                  <Gift className="w-5 h-5 text-zinc-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{survey.rewardAmount} {survey.rewardToken}</p>
                    <p className="text-xs text-zinc-500">Token Reward</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-4">
                  <Star className="w-5 h-5 text-zinc-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{survey.heardPointsReward}</p>
                    <p className="text-xs text-zinc-500">HeardPoints</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Survey</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-700 whitespace-pre-wrap">{survey.detailedDescription}</p>
              </CardContent>
            </Card>

            {/* Criteria */}
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-700 whitespace-pre-wrap">{survey.criteria}</p>
              </CardContent>
            </Card>

            {/* Eligibility Status */}
            {eligibility && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Eligibility Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hasCompleted ? (
                      <Alert>
                        <AlertDescription>
                          You have already completed this survey. Thank you for your participation!
                        </AlertDescription>
                      </Alert>
                    ) : eligibility.isEligible ? (
                      <Alert>
                        <AlertDescription>
                          You are eligible to take this survey.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {eligibility.reason || "You are not eligible for this survey."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reward Section - Show if user has completed and received reward */}
            {hasCompleted && userReward?.claimLink && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Reward</CardTitle>
                  <CardDescription>
                    Congratulations! You have completed this survey and earned your reward.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Reward Summary */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Survey Completed!</span>
                      </div>
                      <div className="text-sm text-green-700">
                        <p>Token Reward: {userReward.survey?.rewardAmount} {userReward.survey?.rewardToken}</p>
                        <p>HeardPoints Earned: {userReward.heardPointsAwarded} HP</p>
                        {userReward.usedAt && (
                          <p>Reward given: {new Date(userReward.usedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Claim Actions */}
                    <div className="space-y-3">
                      <div className="text-sm text-zinc-600">
                        Use the link below to claim your {userReward.survey?.rewardAmount} {userReward.survey?.rewardToken} tokens:
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          onClick={handleClaimReward}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Claim Reward
                        </Button>

                        <Button
                          onClick={handleCopyClaimLink}
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* QR Code */}
                      <div className="text-center">
                        <div className="inline-block p-2 bg-white rounded-lg border">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(userReward.claimLink)}`}
                            alt="QR Code for reward claim"
                            className="w-30 h-30"
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Scan with your wallet app</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            <div className="flex justify-center pt-4">
              {hasCompleted ? (
                <Button disabled className="px-8 py-3">
                  Survey Completed
                </Button>
              ) : canTakeSurvey ? (
                <Button
                  onClick={handleStartSurvey}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3"
                >
                  Start Survey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button disabled className="px-8 py-3">
                  Not Eligible
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

        <Footer />
      </div>
    </SurveyPageWrapper>
  )
}
