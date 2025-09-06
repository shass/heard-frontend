'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSurveyResponses } from '@/lib/api/admin'
import type { AdminSurveyResponse, AdminSurveyListItem } from '@/lib/types'

interface UseSurveyResponsesProps {
  survey: AdminSurveyListItem
  open: boolean
}

export function useSurveyResponses({ survey, open }: UseSurveyResponsesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<AdminSurveyResponse | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const { data: responsesData, isLoading, error } = useQuery({
    queryKey: ['survey-responses', survey.id, { search: searchTerm }],
    queryFn: () => getSurveyResponses(survey.id, { search: searchTerm }),
    enabled: open, // Only fetch when dialog is open
  })

  const responses = responsesData?.responses || []

  const handleViewDetails = (response: AdminSurveyResponse) => {
    setSelectedResponse(response)
    setIsDetailDialogOpen(true)
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
    
    // Data
    responses,
    isLoading,
    error,
    
    // Handlers
    handleViewDetails,
    handleExportResponses
  }
}