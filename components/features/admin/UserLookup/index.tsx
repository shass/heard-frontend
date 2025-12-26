'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/loading-states'
import { Search, X, UserSearch } from 'lucide-react'
import { useWalletLookup } from './hooks/useWalletLookup'
import { UserInfoCard } from './UserInfoCard'
import { SurveyResponsesList } from './SurveyResponsesList'
import { ResponseDetailsModal } from './ResponseDetailsModal'

export function UserLookup() {
  const {
    walletAddress,
    setWalletAddress,
    searchedWallet,
    lookupData,
    isLookupLoading,
    lookupError,
    responseDetails,
    isDetailsLoading,
    detailsError,
    selectedSurveyId,
    handleSearch,
    handleClear,
    handleSelectSurvey,
    handleCloseSurveyDetails
  } = useWalletLookup()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserSearch className="w-5 h-5" />
            User Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter wallet address (0x...)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={!walletAddress.trim()}>
              Search
            </Button>
            {searchedWallet && (
              <Button variant="outline" onClick={handleClear}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLookupLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {lookupError && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-red-600">
              Failed to lookup wallet: {lookupError.message}
            </p>
          </CardContent>
        </Card>
      )}

      {lookupData && !isLookupLoading && (
        <div className="space-y-6">
          <UserInfoCard user={lookupData.user} stats={lookupData.stats} />
          <SurveyResponsesList
            responses={lookupData.surveyResponses}
            onSelectSurvey={handleSelectSurvey}
          />
        </div>
      )}

      <ResponseDetailsModal
        isOpen={!!selectedSurveyId}
        onClose={handleCloseSurveyDetails}
        details={responseDetails}
        isLoading={isDetailsLoading}
        error={detailsError}
      />
    </div>
  )
}
