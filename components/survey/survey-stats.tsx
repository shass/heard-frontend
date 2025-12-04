"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Gift, Star } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { Survey } from "@/lib/types"
import type { ISurveyStrategy } from "@/lib/survey/strategies"

interface SurveyStatsProps {
  survey: Survey
  strategy?: ISurveyStrategy | null
}

export function SurveyStats({ survey, strategy }: SurveyStatsProps) {
  // Use strategy to determine if we should show token reward
  const infoConfig = strategy?.getInfoConfig(survey)
  const showTokenReward = infoConfig?.showTokenReward ?? true

  return (
    <div className={`grid grid-cols-1 ${showTokenReward ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
      <Card>
        <CardContent className="flex items-center p-4">
          <Clock className="w-5 h-5 text-zinc-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-zinc-900">{survey.totalQuestions}</p>
            <p className="text-xs text-zinc-500">Questions</p>
          </div>
        </CardContent>
      </Card>

      {showTokenReward && (
        <Card>
          <CardContent className="flex items-center p-4">
            <Gift className="w-5 h-5 text-zinc-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-zinc-900">{formatNumber(survey.rewardAmount)} {survey.rewardToken}</p>
              <p className="text-xs text-zinc-500">Token Reward</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center p-4">
          <Star className="w-5 h-5 text-zinc-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-zinc-900">{formatNumber(survey.heardPointsReward)}</p>
            <p className="text-xs text-zinc-500">HeardPoints</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
