'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/loading-states'
import { SurveyForm } from '@/components/admin/survey-form'
import { SurveyResponses } from '@/components/admin/survey-responses'
import { WhitelistModal } from '@/components/admin/whitelist-modal'
import { RewardLinksModalPaginated } from '@/components/admin/reward-links-modal-paginated'
import { SurveyClientsModal } from '@/components/admin/survey-clients-modal'
import { WinnersModal } from '../WinnersModal'
import { SurveyActions } from './SurveyActions'
import { SurveyList } from './SurveyList'
import { useSurveyManagement } from './hooks/useSurveyManagement'
import { useState } from 'react'

export function SurveyManagement() {
  const {
    // State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedSurvey,
    setSelectedSurvey,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isResponsesDialogOpen,
    setIsResponsesDialogOpen,
    isWhitelistModalOpen,
    setIsWhitelistModalOpen,
    isRewardLinksModalOpen,
    setIsRewardLinksModalOpen,
    isSurveyClientsModalOpen,
    setIsSurveyClientsModalOpen,
    isImportDialogOpen,
    setIsImportDialogOpen,
    importFile,
    importResults,

    // Data
    surveys,
    isLoading,
    error,

    // Mutations
    createSurveyMutation,
    updateSurveyMutation,
    toggleStatusMutation,
    duplicateSurveyMutation,
    refreshStatsMutation,
    importSurveysMutation,
    exportSurveyMutation,
    deleteSurveyMutation,

    // Handlers
    handleCreateSurvey,
    handleUpdateSurvey,
    handleDeleteSurvey,
    handleToggleStatus,
    handleDuplicateSurvey,
    handleExportSurvey,
    handleFileSelect,
    handleImport,
    resetImport
  } = useSurveyManagement()

  // Local state for winners modal
  const [isWinnersModalOpen, setIsWinnersModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Surveys</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  const handleViewResponses = (survey: any) => {
    setSelectedSurvey(survey)
    setIsResponsesDialogOpen(true)
  }

  const handleManageWhitelist = (survey: any) => {
    setSelectedSurvey(survey)
    setIsWhitelistModalOpen(true)
  }

  const handleManageRewardLinks = (survey: any) => {
    setSelectedSurvey(survey)
    setIsRewardLinksModalOpen(true)
  }

  const handleManageSurveyClients = (survey: any) => {
    setSelectedSurvey(survey)
    setIsSurveyClientsModalOpen(true)
  }

  const handleManageWinners = (survey: any) => {
    setSelectedSurvey(survey)
    setIsWinnersModalOpen(true)
  }

  const handleEdit = (survey: any) => {
    setSelectedSurvey(survey)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <SurveyActions
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefreshStats={() => refreshStatsMutation.mutate(undefined)}
        isRefreshStatsPending={refreshStatsMutation.isPending}
        onCreateSurvey={() => setIsCreateDialogOpen(true)}
        isImportDialogOpen={isImportDialogOpen}
        onImportDialogChange={(open) => {
          if (!open) resetImport()
          setIsImportDialogOpen(open)
        }}
        importFile={importFile}
        importResults={importResults}
        onFileSelect={handleFileSelect}
        onImport={handleImport}
        onResetImport={resetImport}
        isImportPending={importSurveysMutation.isPending}
      />

      {/* Surveys Grid */}
      <SurveyList
        surveys={surveys}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onCreateNew={() => setIsCreateDialogOpen(true)}
        onToggleStatus={handleToggleStatus}
        onRefreshStats={(surveyId?: string) => refreshStatsMutation.mutate(surveyId)}
        onViewResponses={handleViewResponses}
        onManageWhitelist={handleManageWhitelist}
        onManageRewardLinks={handleManageRewardLinks}
        onManageSurveyClients={handleManageSurveyClients}
        onManageWinners={handleManageWinners}
        onEdit={handleEdit}
        onDuplicate={handleDuplicateSurvey}
        onExport={handleExportSurvey}
        onDelete={handleDeleteSurvey}
        isToggleStatusPending={toggleStatusMutation.isPending}
        isRefreshStatsPending={refreshStatsMutation.isPending}
        isDuplicatePending={duplicateSurveyMutation.isPending}
        isExportPending={exportSurveyMutation.isPending}
        isDeletePending={deleteSurveyMutation.isPending}
      />

      {/* Create Survey Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Survey</DialogTitle>
          </DialogHeader>
          <SurveyForm
            onSubmit={handleCreateSurvey}
            isLoading={createSurveyMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Survey Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
          </DialogHeader>
          {selectedSurvey && (
            <SurveyForm
              survey={selectedSurvey}
              onSubmit={handleUpdateSurvey}
              isLoading={updateSurveyMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedSurvey(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Survey Responses Dialog */}
      {selectedSurvey && (
        <SurveyResponses
          survey={selectedSurvey}
          open={isResponsesDialogOpen}
          onOpenChange={(open) => {
            setIsResponsesDialogOpen(open)
            if (!open) {
              setSelectedSurvey(null)
            }
          }}
        />
      )}

      {/* Whitelist Management Modal */}
      <WhitelistModal
        survey={selectedSurvey}
        isOpen={isWhitelistModalOpen}
        onClose={() => {
          setIsWhitelistModalOpen(false)
          setSelectedSurvey(null)
        }}
      />

      {/* Reward Links Management Modal */}
      <RewardLinksModalPaginated
        survey={selectedSurvey}
        isOpen={isRewardLinksModalOpen}
        onClose={() => {
          setIsRewardLinksModalOpen(false)
          setSelectedSurvey(null)
        }}
      />

      {/* Survey Clients Management Modal */}
      <SurveyClientsModal
        survey={selectedSurvey}
        isOpen={isSurveyClientsModalOpen}
        onClose={() => {
          setIsSurveyClientsModalOpen(false)
          setSelectedSurvey(null)
        }}
      />

      {/* Winners Management Modal */}
      <WinnersModal
        survey={selectedSurvey}
        isOpen={isWinnersModalOpen}
        onClose={() => {
          setIsWinnersModalOpen(false)
          setSelectedSurvey(null)
        }}
      />
    </div>
  )
}