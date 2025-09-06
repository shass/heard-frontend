'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getWhitelistEntriesPaged,
  removeWhitelistEntry,
  clearWhitelist
} from '@/lib/api/admin'
import { useNotifications } from '@/components/ui/notifications'
import { useDebounce } from './useDebounce'
import type { AdminSurveyListItem } from '@/lib/types'

interface UseWhitelistModalProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
}

export function useWhitelistModal({ survey, isOpen }: UseWhitelistModalProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  
  const notifications = useNotifications()
  const queryClient = useQueryClient()
  
  // Debounce search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  const ITEMS_PER_PAGE = 20

  // Get paginated whitelist with search for addresses tab
  const { data: pagedData, isLoading: isPagedLoading, error: pagedError } = useQuery({
    queryKey: ['whitelist-paged', survey?.id, debouncedSearchTerm, currentPage],
    queryFn: () => survey ? getWhitelistEntriesPaged(survey.id, {
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
      search: debouncedSearchTerm || undefined
    }) : Promise.resolve(null),
    enabled: !!survey && isOpen && activeTab === 'manage'
  })

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('upload')
      setSearchTerm('')
      setCurrentPage(0)
    }
  }, [isOpen])
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedSearchTerm])

  // Clear whitelist mutation
  const clearWhitelistMutation = useMutation({
    mutationFn: async () => {
      if (!survey) throw new Error('No survey selected')
      await clearWhitelist(survey.id)
    },
    onSuccess: () => {
      notifications.success('Whitelist cleared', 'All addresses have been removed from whitelist')
      queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to clear whitelist'
      notifications.error('Clear Failed', errorMessage)
    }
  })
  
  // Remove single address mutation
  const removeAddressMutation = useMutation({
    mutationFn: ({ surveyId, address }: { surveyId: string, address: string }) =>
      removeWhitelistEntry(surveyId, address),
    onSuccess: () => {
      notifications.success('Address removed', 'Address has been removed from whitelist')
      queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to remove address'
      notifications.error('Remove Failed', errorMessage)
    }
  })

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all addresses from this whitelist?')) {
      clearWhitelistMutation.mutate()
    }
  }
  
  const handleRemoveAddress = (address: string) => {
    if (!survey) return
    if (confirm(`Are you sure you want to remove address ${address} from the whitelist?`)) {
      removeAddressMutation.mutate({ surveyId: survey.id, address })
    }
  }
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleUploadSuccess = () => {
    // Refresh data and switch to manage tab
    queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
    queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    setActiveTab('manage')
    notifications.success('Upload Complete', 'Successfully imported addresses')
  }

  return {
    // State
    activeTab,
    setActiveTab,
    searchTerm,
    currentPage,
    ITEMS_PER_PAGE,
    
    // Data
    pagedData,
    isPagedLoading,
    pagedError,
    
    // Mutations
    clearWhitelistMutation,
    removeAddressMutation,
    
    // Handlers
    handleClear,
    handleRemoveAddress,
    handleSearchChange,
    handlePageChange,
    handleUploadSuccess
  }
}