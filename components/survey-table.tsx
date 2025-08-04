"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingState, SurveyTableSkeleton } from "@/components/ui/loading-states"
import { useActiveSurveys } from "@/hooks/use-surveys"
import { useSearchSurveys } from "@/hooks/use-search-surveys"
import { useNotifications } from "@/components/ui/notifications"
import { Copy, Check } from "lucide-react"
import { MotionSurveyTable } from "./motion-survey-table"
import { motion, AnimatePresence } from "motion/react"
import type { Survey } from "@/lib/types"

interface SurveyTableProps {
  onTakeSurvey: (survey: Survey) => void
}

interface SurveyRowProps {
  survey: Survey
  onTakeSurvey: (survey: Survey) => void
  onCopyLink: (surveyId: string) => void
  copiedSurveyId: string | null
}

function MobileSurveyCard({ survey, onTakeSurvey, onCopyLink, copiedSurveyId }: SurveyRowProps) {
  const getButtonStyle = () => {
    return "bg-zinc-900 hover:bg-zinc-800"
  }

  const handleButtonClick = () => {
    onTakeSurvey(survey)
  }

  const formatReward = (survey: Survey) => {
    const tokenReward = `${survey.rewardAmount} ${survey.rewardToken}`
    const pointsReward = survey.heardPointsReward > 0 ? ` + ${survey.heardPointsReward} HP` : ""
    return tokenReward + pointsReward
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{survey.name}</h3>
          <p className="text-sm text-zinc-600">{survey.company}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {survey.totalQuestions} questions • {survey.responseCount} responses
          </p>
        </div>

        <div>
          <div className="text-base font-medium text-zinc-900">{formatReward(survey)}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleButtonClick}
            className={`text-white rounded-lg px-4 py-2 text-sm font-medium ${getButtonStyle()}`}
            title="View survey information"
          >
            Take
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyLink(survey.id)}
            className="flex items-center gap-1"
          >
            {copiedSurveyId === survey.id ? (
              <Check className="w-4 h-4 text-zinc-900" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SurveyTable({ onTakeSurvey }: SurveyTableProps) {
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

  if (error) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Failed to load surveys</h3>
            <p className="text-zinc-600 mb-4">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
            <Button onClick={() => refetch()} className="bg-orange-500 hover:bg-orange-600">
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search surveys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              style={{ minHeight: '42px' }}
            />
            {(searchQuery || selectedCompany) && isFetching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-300 border-t-orange-500"></div>
              </div>
            )}
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white bg-no-repeat bg-[right_0.7rem_center] bg-[length:16px] pr-10 truncate"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                minHeight: '42px'
              }}
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
        </div>

        <LoadingState
          loading={showLoading}
          error={error ? "Failed to load surveys" : null}
          empty={filteredSurveys.length === 0}
          emptyMessage={searchQuery || selectedCompany ? "No surveys match your filters" : "No surveys available"}
          skeleton={<SurveyTableSkeleton rows={5} />}
        >
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full relative">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Survey</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Reward</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Action</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Share</th>
                  </tr>
                </thead>
                <MotionSurveyTable
                  surveys={filteredSurveys}
                  renderRow={(survey) => (
                    <>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-base font-medium text-zinc-900">{survey.name}</div>
                          <div className="text-sm text-zinc-500">{survey.totalQuestions} questions</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-base text-zinc-600">{survey.company}</td>
                      <td className="px-6 py-4">
                        <div className="text-base font-medium text-zinc-900">
                          {`${survey.rewardAmount} ${survey.rewardToken}`}
                          {survey.heardPointsReward > 0 ? ` + ${survey.heardPointsReward} HP` : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleTakeSurvey(survey)}
                          className="text-white rounded-lg px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800"
                          title="View survey information"
                        >
                          Take
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(survey.id)}
                          className="flex items-center gap-2"
                        >
                          {copiedSurveyId === survey.id ? (
                            <Check className="w-4 h-4 text-zinc-900" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </>
                  )}
                />
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <motion.div
            className="lg:hidden space-y-4 relative"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredSurveys.map((survey) => (
                <motion.div
                  key={survey.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    x: 100,
                    scale: 0.95,
                    transition: {
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  }}
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 120
                  }}
                  style={{
                    transformOrigin: 'center center'
                  }}
                >
                  <MobileSurveyCard
                    survey={survey}
                    onTakeSurvey={handleTakeSurvey}
                    onCopyLink={handleCopyLink}
                    copiedSurveyId={copiedSurveyId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
