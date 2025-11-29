"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, ExternalLink } from "lucide-react"
import { useWinnerStatus } from "@/hooks"
import { SurveyType, type Survey } from "@/lib/types"

interface WinnerRewardProps {
  surveyId: string
  survey: Survey
}

export function WinnerReward({ surveyId, survey }: WinnerRewardProps) {
  // Only show for time-limited surveys
  if (survey.surveyType !== SurveyType.TIME_LIMITED) return null
  if (!survey.endDate) return null

  const now = new Date()
  const endDate = new Date(survey.endDate)
  const isEnded = now >= endDate

  // Only show after survey has ended
  if (!isEnded) return null

  const { data: winnerStatus, isLoading, isError } = useWinnerStatus(surveyId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Your Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Don't show anything if there was an error checking status
  if (isError) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Your Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!winnerStatus?.isWinner && (
          <div className="text-center py-4">
            <p className="text-zinc-600">
              Unfortunately, you did not win in this survey.
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              Thank you for your participation!
            </p>
          </div>
        )}

        {winnerStatus?.isWinner && winnerStatus.reward && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                🎉 Congratulations! You are a winner!
              </Badge>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {winnerStatus.reward.place && (
                  <Badge variant="outline" className="border-green-600 text-green-700">
                    Place #{winnerStatus.reward.place}
                  </Badge>
                )}
                {winnerStatus.reward.rewardType && (
                  <span className="text-sm font-medium text-green-800">
                    {winnerStatus.reward.rewardType}
                  </span>
                )}
              </div>

              <Button
                asChild
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <a
                  href={winnerStatus.reward.rewardLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Claim Your Reward
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
