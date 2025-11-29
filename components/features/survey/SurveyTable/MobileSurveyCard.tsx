import { Button } from "@/components/ui/button"
import { Copy, Check, Share2 } from "lucide-react"
import { isSurveyEnded } from "@/lib/utils"
import { formatSurveyReward, getSurveyTypeLabel } from "@/lib/survey/helpers"
import type { Survey } from "@/lib/types"
import { usePlatformDetector } from "@/src/platforms/_core"
import { Platform } from "@/src/platforms/config"

interface MobileSurveyCardProps {
  survey: Survey
  onTakeSurvey: (survey: Survey) => void
  onCopyLink: (surveyId: string) => void
  copiedSurveyId: string | null
}

export function MobileSurveyCard({ survey, onTakeSurvey, onCopyLink, copiedSurveyId }: MobileSurveyCardProps) {
  const { platform } = usePlatformDetector()

  // Show Share icon in Base App and Farcaster, Copy icon in Web
  const ShareIcon = platform === Platform.BASE_APP || platform === Platform.FARCASTER ? Share2 : Copy
  const isEnded = isSurveyEnded(survey)
  const surveyTypeLabel = getSurveyTypeLabel(survey.surveyType)
  const rewardDisplay = formatSurveyReward(survey, 'list')

  const getButtonStyle = () => {
    return "bg-zinc-900 hover:bg-zinc-800"
  }

  const handleButtonClick = () => {
    onTakeSurvey(survey)
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">
            {isEnded && 'Finished: '}{survey.name}
          </h3>
          <p className="text-sm text-zinc-600">{survey.company}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {surveyTypeLabel}
          </p>
        </div>

        <div>
          <div className="text-base font-medium text-zinc-900">{rewardDisplay}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleButtonClick}
            className={`text-white rounded-lg px-4 py-2 text-sm font-medium ${getButtonStyle()}`}
            title="View survey information"
          >
            {isEnded ? 'Check' : 'Take'}
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
              <ShareIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
