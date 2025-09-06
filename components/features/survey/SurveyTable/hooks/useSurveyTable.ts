"use client"

import { useState, useEffect } from "react"
import { useActiveSurveys } from "@/hooks/use-surveys"
import { useSearchSurveys } from "@/hooks/use-search-surveys"
import { useNotifications } from "@/components/ui/notifications"
import type { Survey } from "@/lib/types"

interface UseSurveyTableProps {
  onTakeSurvey: (survey: Survey) => void
}

export function useSurveyTable({ onTakeSurvey }: UseSurveyTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [copiedSurveyId, setCopiedSurveyId] = useState<string | null>(null)

  // Use search hook for server-side search with throttling
  const {
    data: searchResults,
    isFetching,
    error: searchError,
    refetch: refetchSearch,
    updateSearch,
    clearSearch,
    hasActiveSearch,
  } = useSearchSurveys({ throttleMs: 250 })

  // Fallback to useActiveSurveys when no search/filter is active
  const {
    data: allSurveys = [],
    isLoading: isLoadingAll,
    error: allSurveysError,
    refetch: refetchAll
  } = useActiveSurveys({ limit: 50 })

  // Determine which data to use
  // When searching, keep showing previous results until new ones arrive
  const surveys = hasActiveSearch
    ? (searchResults?.surveys || allSurveys)
    : allSurveys

  // Show loading only on very first load when we have no data at all
  const showLoading = !hasActiveSearch && isLoadingAll && allSurveys.length === 0
  const error = hasActiveSearch ? searchError : allSurveysError
  const refetch = hasActiveSearch ? refetchSearch : refetchAll

  const notifications = useNotifications()

  // Update search when inputs change
  useEffect(() => {
    if (searchQuery || selectedCompany) {
      updateSearch({
        search: searchQuery || undefined,
        company: selectedCompany || undefined
      })
    } else {
      clearSearch()
    }
  }, [searchQuery, selectedCompany, updateSearch, clearSearch])

  // Surveys are already filtered on server-side, so use them directly
  const filteredSurveys = surveys

  // Get unique companies for filter (use all surveys for company list)
  const companies = Array.from(new Set(allSurveys.map(s => s.company))).sort()

  const handleTakeSurvey = (survey: Survey) => {
    try {
      onTakeSurvey(survey)
    } catch (error) {
      notifications.error(
        "Failed to start survey",
        "Please try again or contact support if the problem persists"
      )
    }
  }

  const handleCopyLink = async (surveyId: string) => {
    try {
      const url = `${window.location.origin}/surveys/${surveyId}/info`
      await navigator.clipboard.writeText(url)
      setCopiedSurveyId(surveyId)
      notifications.success("Link copied", "")

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedSurveyId(null)
      }, 1500)
    } catch (error) {
      notifications.error("Failed to copy link", "Please try again")
    }
  }

  return {
    // State
    searchQuery,
    setSearchQuery,
    selectedCompany,
    setSelectedCompany,
    copiedSurveyId,
    
    // Data
    surveys,
    filteredSurveys,
    companies,
    showLoading,
    error,
    isFetching,
    
    // Handlers
    handleTakeSurvey,
    handleCopyLink,
    refetch
  }
}