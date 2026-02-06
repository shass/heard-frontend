'use client'

import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { SurveyCard } from './SurveyCard'
import type { AdminSurveyListItem } from '@/lib/types'

interface SurveyListProps {
  surveys: AdminSurveyListItem[]
  searchTerm: string
  statusFilter: 'all' | 'active' | 'inactive'
  onCreateNew: () => void
  onToggleStatus: (surveyId: string, currentStatus: boolean) => void
  onRefreshStats: (surveyId?: string) => void
  onViewResponses: (survey: AdminSurveyListItem) => void
  onManageWhitelist: (survey: AdminSurveyListItem) => void
  onManageRewardLinks: (survey: AdminSurveyListItem) => void
  onManageSurveyClients: (survey: AdminSurveyListItem) => void
  onManageWinners?: (survey: AdminSurveyListItem) => void
  onEdit: (survey: AdminSurveyListItem) => void
  onDuplicate: (surveyId: string, currentName: string) => void
  onExport: (surveyId: string) => void
  onDelete: (surveyId: string) => void
  onUpdateAccessConfig: (surveyId: string, strategyId: string, config: Record<string, unknown>) => Promise<void>
  isToggleStatusPending: boolean
  isRefreshStatsPending: boolean
  isDuplicatePending: boolean
  isExportPending: boolean
  isDeletePending: boolean
}

export function SurveyList({
  surveys,
  searchTerm,
  statusFilter,
  onCreateNew,
  onToggleStatus,
  onRefreshStats,
  onViewResponses,
  onManageWhitelist,
  onManageRewardLinks,
  onManageSurveyClients,
  onManageWinners,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
  onUpdateAccessConfig,
  isToggleStatusPending,
  isRefreshStatsPending,
  isDuplicatePending,
  isExportPending,
  isDeletePending
}: SurveyListProps) {
  if (surveys.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
        <p className="text-gray-600 mb-4">
          {searchTerm || statusFilter !== 'all'
            ? 'Try adjusting your search or filter criteria.'
            : 'Create your first survey to get started.'
          }
        </p>
        <Button onClick={onCreateNew}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Survey
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {surveys.map((survey) => (
        <SurveyCard
          key={survey.id}
          survey={survey}
          onToggleStatus={onToggleStatus}
          onRefreshStats={onRefreshStats}
          onViewResponses={onViewResponses}
          onManageWhitelist={onManageWhitelist}
          onManageRewardLinks={onManageRewardLinks}
          onManageSurveyClients={onManageSurveyClients}
          onManageWinners={onManageWinners}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onExport={onExport}
          onDelete={onDelete}
          onUpdateAccessConfig={onUpdateAccessConfig}
          isToggleStatusPending={isToggleStatusPending}
          isRefreshStatsPending={isRefreshStatsPending}
          isDuplicatePending={isDuplicatePending}
          isExportPending={isExportPending}
          isDeletePending={isDeletePending}
        />
      ))}
    </div>
  )
}