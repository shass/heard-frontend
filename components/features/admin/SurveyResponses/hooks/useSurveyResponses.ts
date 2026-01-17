'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSurveyResponses, deleteSurveyResponse, exportSurveyResponsesCsv } from '@/lib/api/admin'
import type { AdminSurveyResponse, AdminSurveyListItem, PaginationMeta } from '@/lib/types'
import { useNotifications } from '@/components/ui/notifications'

const PAGE_SIZE = 20
const EXPORT_LIMIT = 10000

interface ExportParams {
  offset: number
  limit: number
}

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
  const [isExporting, setIsExporting] = useState(false)

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

  const handleExportResponses = useCallback(async (params?: ExportParams) => {
    if (isExporting) return

    setIsExporting(true)
    try {
      const exportOffset = params?.offset ?? 0
      const exportLimit = params?.limit ?? EXPORT_LIMIT

      const blob = await exportSurveyResponsesCsv(survey.id, {
        offset: exportOffset,
        limit: exportLimit
      })

      // Create filename with range info if offset > 0
      const safeName = survey.name.replace(/[^a-zA-Z0-9]/g, '_')
      const dateStr = new Date().toISOString().split('T')[0]
      const rangeInfo = exportOffset > 0 ? `_from${exportOffset + 1}` : ''
      const filename = `${safeName}_responses${rangeInfo}_${dateStr}.csv`

      // Create and download file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      notifications.success('Export complete', 'Survey responses exported to CSV.')
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || 'An error occurred while exporting responses'
      notifications.error('Export failed', errorMessage)
    } finally {
      setIsExporting(false)
    }
  }, [survey.id, survey.name, notifications, isExporting])

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
    isExporting,
    exportLimit: EXPORT_LIMIT,

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
