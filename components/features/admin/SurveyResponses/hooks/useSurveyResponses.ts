'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSurveyResponses, deleteSurveyResponse } from '@/lib/api/admin'
import type { AdminSurveyResponse, AdminSurveyListItem, PaginationMeta } from '@/lib/types'
import { useNotifications } from '@/components/ui/notifications'

const PAGE_SIZE = 20

interface UseSurveyResponsesProps {
  survey: AdminSurveyListItem
  open: boolean
}

export function useSurveyResponses({ survey, open }: UseSurveyResponsesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const [selectedResponse, setSelectedResponse] = useState<AdminSurveyResponse | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [responseToDelete, setResponseToDelete] = useState<AdminSurveyResponse | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const notifications = useNotifications()

  const { data: responsesData, isLoading, error } = useQuery({
    queryKey: ['survey-responses', survey.id, { search: searchTerm, offset }],
    queryFn: () => getSurveyResponses(survey.id, {
      search: searchTerm,
      offset,
      limit: PAGE_SIZE
    }),
    enabled: open,
  })

  const responses = responsesData?.responses || []
  const pagination: PaginationMeta = responsesData?.meta || {
    limit: PAGE_SIZE,
    offset: 0,
    total: 0,
    hasMore: false
  }

  const deleteMutation = useMutation({
    mutationFn: ({ surveyId, walletAddress }: { surveyId: string; walletAddress: string }) =>
      deleteSurveyResponse(surveyId, walletAddress),
    onSuccess: (data) => {
      notifications.success(
        'Response deleted',
        `Deleted ${data.deletedCount} response(s). User can now retake the survey.`
      )
      queryClient.invalidateQueries({ queryKey: ['survey-responses', survey.id] })
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

  const handleNextPage = useCallback(() => {
    if (pagination.hasMore) {
      setOffset(prev => prev + PAGE_SIZE)
    }
  }, [pagination.hasMore])

  const handlePrevPage = useCallback(() => {
    setOffset(prev => Math.max(0, prev - PAGE_SIZE))
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setOffset(0)
  }, [])

  return {
    // State
    searchTerm,
    setSearchTerm: handleSearchChange,
    selectedResponse,
    setSelectedResponse,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    responseToDelete,
    isDeleteDialogOpen,

    // Data
    responses,
    pagination,
    isLoading,
    error,
    isDeleting: deleteMutation.isPending,

    // Handlers
    handleViewDetails,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleExportResponses,
    handleNextPage,
    handlePrevPage
  }
}
