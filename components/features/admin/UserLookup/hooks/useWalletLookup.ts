'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { lookupWallet, getWalletResponseDetails } from '@/lib/api/admin'
import type { WalletLookupResponse, WalletResponseDetails } from '@/lib/types'

export function useWalletLookup() {
  const [walletAddress, setWalletAddress] = useState('')
  const [searchedWallet, setSearchedWallet] = useState<string | null>(null)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const {
    data: lookupData,
    isLoading: isLookupLoading,
    error: lookupError,
    refetch: refetchLookup
  } = useQuery<WalletLookupResponse>({
    queryKey: ['wallet-lookup', searchedWallet],
    queryFn: () => lookupWallet(searchedWallet!),
    enabled: !!searchedWallet
  })

  const {
    data: responseDetails,
    isLoading: isDetailsLoading,
    error: detailsError
  } = useQuery<WalletResponseDetails>({
    queryKey: ['wallet-response-details', searchedWallet, selectedSurveyId],
    queryFn: () => getWalletResponseDetails(searchedWallet!, selectedSurveyId!),
    enabled: !!searchedWallet && !!selectedSurveyId
  })

  const handleSearch = () => {
    const trimmed = walletAddress.trim().toLowerCase()
    if (trimmed) {
      setSelectedSurveyId(null)
      setSearchedWallet(trimmed)
    }
  }

  const handleClear = () => {
    setWalletAddress('')
    setSearchedWallet(null)
    setSelectedSurveyId(null)
  }

  const handleSelectSurvey = (surveyId: string) => {
    setSelectedSurveyId(surveyId)
  }

  const handleCloseSurveyDetails = () => {
    setSelectedSurveyId(null)
  }

  return {
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
    handleCloseSurveyDetails,
    refetchLookup
  }
}
