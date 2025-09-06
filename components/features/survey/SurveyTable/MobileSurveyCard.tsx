import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import type { Survey } from "@/lib/types"

interface MobileSurveyCardProps {
  survey: Survey
  onTakeSurvey: (survey: Survey) => void
  onCopyLink: (surveyId: string) => void
  copiedSurveyId: string | null
}

export function MobileSurveyCard({ survey, onTakeSurvey, onCopyLink, copiedSurveyId }: MobileSurveyCardProps) {
  const getButtonStyle = () => {
    return "bg-zinc-900 hover:bg-zinc-800"
  }

  const handleButtonClick = () => {
    onTakeSurvey(survey)
  }

  const formatReward = (survey: Survey) => {
    const tokenReward = `${formatNumber(survey.rewardAmount)} ${survey.rewardToken}`
    const pointsReward = survey.heardPointsReward > 0 ? ` + ${formatNumber(survey.heardPointsReward)} HP` : ""
    return tokenReward + pointsReward
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{survey.name}</h3>
          <p className="text-sm text-zinc-600">{survey.company}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {survey.totalQuestions} questions • {survey.responseCount} responses
          </p>
        </div>

        <div>
          <div className="text-base font-medium text-zinc-900">{formatReward(survey)}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleButtonClick}
            className={`text-white rounded-lg px-4 py-2 text-sm font-medium ${getButtonStyle()}`}
            title="View survey information"
          >
            Take
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyLink(survey.id)}
            className="flex items-center gap-1"
          >
            {copiedSurveyId === survey.id ? (
              <Check className="w-4 h-4 text-zinc-900" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}