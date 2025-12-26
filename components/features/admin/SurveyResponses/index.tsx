'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AdminSurveyListItem } from '@/lib/types'
import { useSurveyResponses } from './hooks/useSurveyResponses'
import { ResponsesHeader } from './ResponsesHeader'
import { ResponsesStats } from './ResponsesStats'
import { ResponsesList } from './ResponsesList'
import { SurveyResponseDetails } from './SurveyResponseDetails'

interface SurveyResponsesProps {
  survey: AdminSurveyListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SurveyResponses({ survey, open, onOpenChange }: SurveyResponsesProps) {
  const {
    // State
    searchTerm,
    setSearchTerm,
    selectedResponse,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    responseToDelete,
    isDeleteDialogOpen,

    // Data
    responses,
    pagination,
    isLoading,
    error,
    isDeleting,

    // Handlers
    handleViewDetails,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleExportResponses,
    handleNextPage,
    handlePrevPage
  } = useSurveyResponses({ survey, open })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              <ResponsesHeader
                survey={survey}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onExportResponses={handleExportResponses}
              />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stats */}
            <ResponsesStats responses={responses} pagination={pagination} />

            {/* Responses List */}
            <ResponsesList
              responses={responses}
              pagination={pagination}
              isLoading={isLoading}
              error={error}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteClick}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Detail Dialog */}
      <SurveyResponseDetails
        response={selectedResponse}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Survey Response?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this user's response?
            </p>

            {responseToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Wallet:</span>
                  <div className="font-mono text-xs mt-1 break-all">
                    {responseToDelete.walletAddress}
                  </div>
                </div>

                {responseToDelete.completedAt && (
                  <div className="text-sm">
                    <span className="text-gray-500">Completed:</span>
                    <div className="mt-1">
                      {new Date(responseToDelete.completedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After deletion, the user will be able to retake the survey.
                Their reward link will remain used and will be reassigned to them if they complete the survey again.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Response'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}