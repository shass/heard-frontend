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
    
    // Data
    responses,
    isLoading,
    error,
    
    // Handlers
    handleViewDetails,
    handleExportResponses
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
            <ResponsesStats responses={responses} />

            {/* Responses List */}
            <ResponsesList
              responses={responses}
              isLoading={isLoading}
              error={error}
              onViewDetails={handleViewDetails}
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
    </>
  )
}