"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoadingState, SurveyTableSkeleton } from "@/components/ui/loading-states"
import { useActiveSurveys, useSurveyEligibility } from "@/hooks/use-surveys"
import { useAuth } from "@/hooks/use-auth"
import { useNotifications } from "@/components/ui/notifications"
import { useConnectModal } from '@rainbow-me/rainbowkit'
import type { Survey } from "@/lib/types"

interface SurveyTableProps {
  onTakeSurvey: (survey: Survey) => void
}

interface SurveyRowProps {
  survey: Survey
  onTakeSurvey: (survey: Survey) => void
  onConnectWallet?: () => void
  onAuthenticate?: () => void
}

function SurveyRow({ survey, onTakeSurvey, onConnectWallet, onAuthenticate }: SurveyRowProps) {
  const { user, isAuthenticated, isConnected } = useAuth()
  const { data: eligibility } = useSurveyEligibility(
    survey.id, 
    user?.walletAddress
  )
  
  const isEligible = eligibility?.eligible ?? true
  const alreadyCompleted = eligibility?.alreadyCompleted ?? false
  
  const canTake = isAuthenticated && isEligible && !alreadyCompleted
  const canInteract = isConnected && (!isAuthenticated || canTake)
  
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet"
    if (!isAuthenticated) return "Authenticate"
    if (alreadyCompleted) return "Completed"
    if (!isEligible) return "Not Eligible"
    return "Take"
  }
  
  const getButtonStyle = () => {
    if (!canInteract) return "bg-zinc-400 cursor-not-allowed"
    return "bg-zinc-900 hover:bg-zinc-800"
  }

  const handleButtonClick = () => {
    if (!isConnected && onConnectWallet) {
      onConnectWallet()
    } else if (isConnected && !isAuthenticated && onAuthenticate) {
      onAuthenticate()
    } else if (canTake) {
      onTakeSurvey(survey)
    }
  }

  const formatReward = (survey: Survey) => {
    const tokenReward = `${survey.rewardAmount} ${survey.rewardToken}`
    const pointsReward = survey.herdPointsReward > 0 ? ` + ${survey.herdPointsReward} HP` : ""
    return tokenReward + pointsReward
  }

  return (
    <>
      {/* Desktop Row */}
      <tr className="hidden lg:table-row hover:bg-zinc-50">
        <td className="px-6 py-4">
          <div>
            <div className="text-base font-medium text-zinc-900">{survey.name}</div>
            <div className="text-sm text-zinc-500">{survey.totalQuestions} questions</div>
          </div>
        </td>
        <td className="px-6 py-4 text-base text-zinc-600">{survey.company}</td>
        <td className="px-6 py-4">
          <div className="text-base font-medium text-zinc-900">{formatReward(survey)}</div>
          <div className="text-sm text-zinc-500">{survey.responseCount} responses</div>
        </td>
        <td className="px-6 py-4">
          <Button
            onClick={handleButtonClick}
            disabled={!canInteract}
            className={`text-white rounded-lg px-4 py-2 text-sm font-medium ${getButtonStyle()}`}
            title={
              !isConnected ? "Connect your wallet to participate" :
              !isAuthenticated ? "Sign a message to prove wallet ownership (free, no gas)" :
              !isEligible ? eligibility?.reason : 
              "Start this survey"
            }
          >
            {getButtonText()}
          </Button>
        </td>
      </tr>

      {/* Mobile Card */}
      <div className="lg:hidden bg-white border border-zinc-200 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900">{survey.name}</h3>
            <p className="text-sm text-zinc-600">{survey.company}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {survey.totalQuestions} questions • {survey.responseCount} responses
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-medium text-zinc-900">{formatReward(survey)}</div>
              {!isEligible && (
                <div className="text-xs text-red-600 mt-1">{eligibility?.reason}</div>
              )}
            </div>
            <Button
              onClick={handleButtonClick}
              disabled={!canInteract}
              className={`text-white rounded-lg px-4 py-2 text-sm font-medium ${getButtonStyle()}`}
              title={
                !isConnected ? "Connect your wallet to participate" :
                !isAuthenticated ? "Sign a message to prove wallet ownership (free, no gas)" :
                !isEligible ? eligibility?.reason : 
                "Start this survey"
              }
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export function SurveyTable({ onTakeSurvey }: SurveyTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  
  const { 
    data: surveys = [], 
    isLoading, 
    error, 
    refetch 
  } = useActiveSurveys({ limit: 50 })
  
  const notifications = useNotifications()
  const { login, isConnected, isAuthenticated } = useAuth()
  const { openConnectModal } = useConnectModal()

  // Filter surveys based on search and company
  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = !searchQuery || 
      survey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.company.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCompany = !selectedCompany || survey.company === selectedCompany
    
    return matchesSearch && matchesCompany
  })

  // Get unique companies for filter
  const companies = Array.from(new Set(surveys.map(s => s.company))).sort()

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

  const handleConnectWallet = () => {
    if (openConnectModal) {
      openConnectModal()
    }
  }

  const handleAuthenticate = async () => {
    try {
      await login()
      notifications.success("Authentication successful", "You can now take surveys")
    } catch (error) {
      notifications.error(
        "Authentication failed",
        "Please try again or contact support if the problem persists"
      )
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
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search surveys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
        </div>

        <LoadingState
          loading={isLoading}
          error={error ? "Failed to load surveys" : null}
          empty={filteredSurveys.length === 0}
          emptyMessage={searchQuery || selectedCompany ? "No surveys match your filters" : "No surveys available"}
          skeleton={<SurveyTableSkeleton rows={5} />}
        >
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Survey</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Reward</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredSurveys.map((survey) => (
                    <SurveyRow 
                      key={survey.id} 
                      survey={survey} 
                      onTakeSurvey={handleTakeSurvey}
                      onConnectWallet={handleConnectWallet}
                      onAuthenticate={handleAuthenticate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredSurveys.map((survey) => (
              <SurveyRow 
                key={survey.id} 
                survey={survey} 
                onTakeSurvey={handleTakeSurvey}
                onConnectWallet={handleConnectWallet}
                onAuthenticate={handleAuthenticate}
              />
            ))}
          </div>
        </LoadingState>

        {/* Results count */}
        {!isLoading && (
          <div className="mt-6 text-center text-sm text-zinc-600">
            Showing {filteredSurveys.length} of {surveys.length} surveys
          </div>
        )}
      </div>
    </section>
  )
}
