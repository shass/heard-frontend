import { Button } from "@/components/ui/button"
import { Copy, Check, Share2 } from "lucide-react"
import { MotionSurveyTable } from "@/components/motion-survey-table"
import { formatNumber, getSurveyTypeLabel, isSurveyEnded } from "@/lib/utils"
import type { Survey } from "@/lib/types"
import { usePlatformDetector } from "@/src/platforms/_core"
import { Platform } from "@/src/platforms/config"

interface DesktopSurveyTableProps {
  surveys: Survey[]
  onTakeSurvey: (survey: Survey) => void
  onCopyLink: (surveyId: string) => void
  copiedSurveyId: string | null
}

export function DesktopSurveyTable({
  surveys,
  onTakeSurvey,
  onCopyLink,
  copiedSurveyId
}: DesktopSurveyTableProps) {
  const { platform } = usePlatformDetector()

  // Show Share icon in Base App and Farcaster, Copy icon in Web
  const ShareIcon = platform === Platform.BASE_APP || platform === Platform.FARCASTER ? Share2 : Copy
  return (
    <div className="hidden lg:block">
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full relative">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Survey</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Company</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Reward</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Action</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Share</th>
            </tr>
          </thead>
          <MotionSurveyTable
            surveys={surveys}
            renderRow={(survey) => {
              const isEnded = isSurveyEnded(survey)
              const surveyTypeLabel = getSurveyTypeLabel(survey.surveyType)

              return (
                <>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-base font-medium text-zinc-900">
                        {isEnded && 'Finished: '}{survey.name}
                      </div>
                      <div className="text-sm text-zinc-500">{surveyTypeLabel}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-base text-zinc-600">{survey.company}</td>
                  <td className="px-6 py-4">
                    <div className="text-base font-medium text-zinc-900">
                      {`${formatNumber(survey.rewardAmount)} ${survey.rewardToken}`}
                      {survey.heardPointsReward > 0 ? ` + ${formatNumber(survey.heardPointsReward)} HP` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => onTakeSurvey(survey)}
                      className="text-white rounded-lg px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800"
                      title="View survey information"
                    >
                      {isEnded ? 'Check' : 'Take'}
                    </Button>
                  </td>
                <td className="px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopyLink(survey.id)}
                    className="flex items-center gap-2"
                  >
                    {copiedSurveyId === survey.id ? (
                      <Check className="w-4 h-4 text-zinc-900" />
                    ) : (
                      <ShareIcon className="w-4 h-4" />
                    )}
                  </Button>
                </td>
              </>
            )
            }}
          />
        </table>
      </div>
    </div>
  )
}