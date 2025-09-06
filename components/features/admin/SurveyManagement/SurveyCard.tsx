'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Users,
  List,
  Gift,
  Download,
  Crown,
  RefreshCw
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { AdminSurveyListItem } from '@/lib/types'

interface SurveyCardProps {
  survey: AdminSurveyListItem
  onToggleStatus: (surveyId: string, currentStatus: boolean) => void
  onRefreshStats: (surveyId?: string) => void
  onViewResponses: (survey: AdminSurveyListItem) => void
  onManageWhitelist: (survey: AdminSurveyListItem) => void
  onManageRewardLinks: (survey: AdminSurveyListItem) => void
  onManageSurveyClients: (survey: AdminSurveyListItem) => void
  onEdit: (survey: AdminSurveyListItem) => void
  onDuplicate: (surveyId: string, currentName: string) => void
  onExport: (surveyId: string) => void
  onDelete: (surveyId: string) => void
  isToggleStatusPending: boolean
  isRefreshStatsPending: boolean
  isDuplicatePending: boolean
  isExportPending: boolean
  isDeletePending: boolean
}

export function SurveyCard({
  survey,
  onToggleStatus,
  onRefreshStats,
  onViewResponses,
  onManageWhitelist,
  onManageRewardLinks,
  onManageSurveyClients,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
  isToggleStatusPending,
  isRefreshStatsPending,
  isDuplicatePending,
  isExportPending,
  isDeletePending
}: SurveyCardProps) {
  return (
    <Card key={survey.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{survey.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{survey.company}</p>
          </div>
          <Badge variant={survey.isActive ? "default" : "secondary"}>
            {survey.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 line-clamp-3">{survey.description}</p>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500">Responses:</span>
              <div className="font-medium">{survey.responseCount}</div>
            </div>
            <div>
              <span className="text-gray-500">Reward:</span>
              <div className="font-medium">{formatNumber(survey.rewardAmount)} {survey.rewardToken}</div>
            </div>
            <div>
              <span className="text-gray-500">HeardPoints:</span>
              <div className="font-medium">{formatNumber(survey.heardPointsReward)} HP</div>
            </div>
          </div>

          <div>
            <span className="text-gray-500">Whitelist:</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="font-medium">{survey.whitelistCount || 0}</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-green-600">{survey.whitelistCompleted || 0}</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-500">{survey.whitelistPending || 0}</span>
              <span className="text-xs text-gray-400 ml-1">(total/completed/pending)</span>
            </div>
          </div>

          <div>
            <span className="text-gray-500">Reward Links:</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="font-medium">{survey.rewardLinksTotal || 0}</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-green-600">{survey.rewardLinksAvailable || 0}</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-500">{survey.rewardLinksUsed || 0}</span>
              <span className="text-xs text-gray-400 ml-1">(total/available/used)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {/* Status Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(survey.id, survey.isActive)}
            disabled={isToggleStatusPending}
            title={survey.isActive ? "Pause Survey" : "Activate Survey"}
          >
            {survey.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          {/* Refresh Stats for Individual Survey */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefreshStats(survey.id)}
            disabled={isRefreshStatsPending}
            title="Refresh Statistics for this Survey"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshStatsPending ? 'animate-spin' : ''}`} />
          </Button>

          {/* View/Manage Actions */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewResponses(survey)}
              title="View Responses"
            >
              <Users className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageWhitelist(survey)}
              title="Manage Whitelist"
            >
              <List className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageRewardLinks(survey)}
              title="Manage Reward Links"
            >
              <Gift className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageSurveyClients(survey)}
              title="Manage Survey Clients"
            >
              <Crown className="w-4 h-4" />
            </Button>
          </div>

          {/* Edit Actions */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(survey)}
              title="Edit Survey"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(survey.id, survey.name)}
              disabled={isDuplicatePending}
              title="Duplicate Survey"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(survey.id)}
              disabled={isExportPending}
              title="Export Survey to JSON"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Delete Action - Separated */}
          <div className="flex-1"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(survey.id)}
            disabled={isDeletePending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete Survey"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}