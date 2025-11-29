"use client"

import React from "react"
import { LoadingState, SurveyTableSkeleton } from "@/components/ui/loading-states"
import type { Survey } from "@/lib/types"
import { useSurveyTable } from "./hooks/useSurveyTable"
import { SurveyFilters } from "./SurveyFilters"
import { DesktopSurveyTable } from "./DesktopSurveyTable"
import { MobileSurveyList } from "./MobileSurveyList"
import { ErrorState } from "./ErrorState"

interface SurveyTableProps {
  onTakeSurvey: (survey: Survey) => void
}

export function SurveyTable({ onTakeSurvey }: SurveyTableProps) {
  const {
    // State
    searchQuery,
    setSearchQuery,
    selectedCompany,
    setSelectedCompany,
    selectedSurveyType,
    setSelectedSurveyType,
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
  } = useSurveyTable({ onTakeSurvey })

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />
  }

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <SurveyFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          selectedSurveyType={selectedSurveyType}
          setSelectedSurveyType={setSelectedSurveyType}
          companies={companies}
          isFetching={isFetching}
        />

        <LoadingState
          loading={showLoading}
          error={error ? "Failed to load surveys" : null}
          empty={filteredSurveys.length === 0}
          emptyMessage={searchQuery || selectedCompany || selectedSurveyType ? "No surveys match your filters" : "No surveys available"}
          skeleton={<SurveyTableSkeleton rows={5} />}
        >
          {/* Desktop Table */}
          <DesktopSurveyTable
            surveys={filteredSurveys}
            onTakeSurvey={handleTakeSurvey}
            onCopyLink={handleCopyLink}
            copiedSurveyId={copiedSurveyId}
          />

          {/* Mobile Cards */}
          <MobileSurveyList
            surveys={filteredSurveys}
            onTakeSurvey={handleTakeSurvey}
            onCopyLink={handleCopyLink}
            copiedSurveyId={copiedSurveyId}
          />
        </LoadingState>

        {/* Results count */}
        {!showLoading && (
          <div className="mt-6 text-center text-sm text-zinc-600">
            Showing {filteredSurveys.length} of {surveys.length} surveys
          </div>
        )}
      </div>
    </section>
  )
}