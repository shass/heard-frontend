"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoadingState, SurveyTableSkeleton } from "@/components/ui/loading-states"
import { useActiveSurveys, useBatchSurveyEligibility } from "@/hooks/use-surveys"
import { useAuthActions } from "@/components/providers/auth-provider"
import { useIsAuthenticated, useUser } from "@/lib/store"
import { useAccount } from 'wagmi'
import { useNotifications } from "@/components/ui/notifications"
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Copy, Check } from "lucide-react"
import type { Survey } from "@/lib/types"

interface SurveyTableProps {
  onTakeSurvey: (survey: Survey) => void
}

interface SurveyRowProps {
  survey: Survey
  onTakeSurvey: (survey: Survey) => void
  onConnectWallet?: () => void
  onAuthenticate?: () => void
  onCopyLink: (surveyId: string) => void
  copiedSurveyId: string | null
  eligibility?: any // Pass eligibility data from batch request
}

function DesktopSurveyRow({ survey, onTakeSurvey, onConnectWallet, onAuthenticate, onCopyLink, copiedSurveyId, eligibility }: SurveyRowProps) {
  const isAuthenticated = useIsAuthenticated()
  const { isConnected } = useAccount()

  // Only use batch eligibility data - no fallback to avoid duplicate requests
  const isEligible = eligibility?.isEligible ?? true
  const alreadyCompleted = eligibility?.hasCompleted ?? false

  // Anyone can click "Take" to view survey info after connecting wallet and authenticating
  const canTake = isAuthenticated
  const canInteract = isConnected && (!isAuthenticated || canTake)

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet"
    if (!isAuthenticated) return "Authenticate"
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
    const pointsReward = survey.heardPointsReward > 0 ? ` + ${survey.heardPointsReward} HP` : ""
    return tokenReward + pointsReward
  }

  return (
    <tr className="hover:bg-zinc-50">
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
            "View survey information"
          }
        >
          {getButtonText()}
        </Button>
      </td>
      <td className="px-6 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopyLink(survey.id)}
          className="flex items-center gap-2"
        >
          {copiedSurveyId === survey.id ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </Button>
      </td>
    </tr>
  )
}

function MobileSurveyCard({ survey, onTakeSurvey, onConnectWallet, onAuthenticate, onCopyLink, copiedSurveyId, eligibility }: SurveyRowProps) {
  const isAuthenticated = useIsAuthenticated()
  const { isConnected } = useAccount()

  // Only use batch eligibility data - no fallback to avoid duplicate requests
  const isEligible = eligibility?.isEligible ?? true
  const alreadyCompleted = eligibility?.hasCompleted ?? false

  // Anyone can click "Take" to view survey info after connecting wallet and authenticating
  const canTake = isAuthenticated
  const canInteract = isConnected && (!isAuthenticated || canTake)

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet"
    if (!isAuthenticated) return "Authenticate"
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

        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-medium text-zinc-900">{formatReward(survey)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyLink(survey.id)}
              className="flex items-center gap-1"
            >
              {copiedSurveyId === survey.id ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleButtonClick}
              disabled={!canInteract}
              className={`text-white rounded-lg px-4 py-2 text-sm font-medium ${getButtonStyle()}`}
              title={
                !isConnected ? "Connect your wallet to participate" :
                !isAuthenticated ? "Sign a message to prove wallet ownership (free, no gas)" :
                "View survey information"
              }
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SurveyTable({ onTakeSurvey }: SurveyTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [copiedSurveyId, setCopiedSurveyId] = useState<string | null>(null)

  const {
    data: surveys = [],
    isLoading,
    error,
    refetch
  } = useActiveSurveys({ limit: 50 })

  const notifications = useNotifications()
  const { login } = useAuthActions()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  // Batch eligibility check for all surveys
  // Only make request if user is authenticated and has a wallet address
  const { data: batchEligibility } = useBatchSurveyEligibility(
    surveys.map(s => s.id),
    isAuthenticated && user?.walletAddress ? user.walletAddress : undefined
  )

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
      console.log('SurveyTable: Starting login process')
      await login()
      console.log('SurveyTable: Login successful')
      notifications.success("Authentication successful", "You can now take surveys")
    } catch (error: any) {
      console.error('SurveyTable: Login failed', error)
      notifications.error(
        "Authentication failed",
        error.message || "Please try again or contact support if the problem persists"
      )
    }
  }

  const handleCopyLink = async (surveyId: string) => {
    try {
      const url = `${window.location.origin}/surveys/${surveyId}/info`
      await navigator.clipboard.writeText(url)
      setCopiedSurveyId(surveyId)
      notifications.success("Link copied!", "Survey link has been copied to clipboard")
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedSurveyId(null)
      }, 2000)
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredSurveys.map((survey) => (
                    <DesktopSurveyRow
                      key={survey.id}
                      survey={survey}
                      onTakeSurvey={handleTakeSurvey}
                      onConnectWallet={handleConnectWallet}
                      onAuthenticate={handleAuthenticate}
                      onCopyLink={handleCopyLink}
                      copiedSurveyId={copiedSurveyId}
                      eligibility={batchEligibility?.[survey.id]}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredSurveys.map((survey) => (
              <MobileSurveyCard
                key={survey.id}
                survey={survey}
                onTakeSurvey={handleTakeSurvey}
                onConnectWallet={handleConnectWallet}
                onAuthenticate={handleAuthenticate}
                onCopyLink={handleCopyLink}
                copiedSurveyId={copiedSurveyId}
                eligibility={batchEligibility?.[survey.id]}
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
