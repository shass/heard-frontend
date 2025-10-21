'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSurveyResponses, deleteSurveyResponse } from '@/lib/api/admin'
import type { AdminSurveyResponse, AdminSurveyListItem } from '@/lib/types'
import { useNotifications } from '@/components/ui/notifications'

interface UseSurveyResponsesProps {
  survey: AdminSurveyListItem
  open: boolean
}

export function useSurveyResponses({ survey, open }: UseSurveyResponsesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<AdminSurveyResponse | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [responseToDelete, setResponseToDelete] = useState<AdminSurveyResponse | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const notifications = useNotifications()

  const { data: responsesData, isLoading, error } = useQuery({
    queryKey: ['survey-responses', survey.id, { search: searchTerm }],
    queryFn: () => getSurveyResponses(survey.id, { search: searchTerm }),
    enabled: open, // Only fetch when dialog is open
  })

  const responses = responsesData?.responses || []

  const deleteMutation = useMutation({
    mutationFn: ({ surveyId, walletAddress }: { surveyId: string; walletAddress: string }) =>
      deleteSurveyResponse(surveyId, walletAddress),
    onSuccess: (data) => {
      notifications.success(
        'Response deleted',
        `Deleted ${data.deletedCount} response(s). User can now retake the survey.`
      )
      // Invalidate and refetch responses
      queryClient.invalidateQueries({ queryKey: ['survey-responses', survey.id] })
      // Close delete dialog
      setIsDeleteDialogOpen(false)
      setResponseToDelete(null)
    },
    onError: (error: any) => {
      notifications.error(
        'Failed to delete response',
        error?.message || 'An error occurred while deleting the response'
      )
    }
  })

  const handleViewDetails = (response: AdminSurveyResponse) => {
    setSelectedResponse(response)
    setIsDetailDialogOpen(true)
  }

  const handleDeleteClick = (response: AdminSurveyResponse) => {
    setResponseToDelete(response)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (responseToDelete) {
      deleteMutation.mutate({
        surveyId: survey.id,
        walletAddress: responseToDelete.walletAddress
      })
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setResponseToDelete(null)
  }

  const handleExportResponses = () => {
    // TODO: Implement CSV export
    console.log('Exporting responses for survey:', survey.id)
  }

  return {
    // State
    searchTerm,
    setSearchTerm,
    selectedResponse,
    setSelectedResponse,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    responseToDelete,
    isDeleteDialogOpen,

    // Data
    responses,
    isLoading,
    error,
    isDeleting: deleteMutation.isPending,

    // Handlers
    handleViewDetails,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleExportResponses
  }
}