'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getRewardLinksPaged, 
  deleteRewardLink, 
  clearAllRewardLinks, 
  importRewardLinks 
} from '@/lib/api/admin'
import { useNotifications } from '@/components/ui/notifications'
import type { AdminSurveyListItem } from '@/lib/types'

export interface PaginationState {
  offset: number
  limit: number
  search: string
}

export type ActiveTab = 'unused' | 'used' | 'manage'

interface UseRewardLinksModalProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
}

export function useRewardLinksModal({ survey, isOpen }: UseRewardLinksModalProps) {
  const [txtData, setTxtData] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('unused')
  const [pagination, setPagination] = useState<PaginationState>({
    offset: 0,
    limit: 20,
    search: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notifications = useNotifications()
  const queryClient = useQueryClient()

  // Reset pagination when switching tabs
  useEffect(() => {
    setPagination(prev => ({ ...prev, offset: 0 }))
  }, [activeTab])

  // Fetch paginated reward links
  const { data: rewardData, isLoading, error } = useQuery({
    queryKey: ['admin-reward-links-paged', survey?.id, activeTab, pagination],
    queryFn: () => 
      survey && (activeTab === 'unused' || activeTab === 'used')
        ? getRewardLinksPaged(survey.id, {
            type: activeTab,
            limit: pagination.limit,
            offset: pagination.offset,
            search: pagination.search || undefined
          })
        : Promise.resolve(null),
    enabled: !!survey && isOpen && (activeTab === 'unused' || activeTab === 'used'),
    // Note: keepPreviousData is deprecated in newer versions, use placeholderData instead
    placeholderData: (previousData) => previousData
  })

  // Delete reward link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (rewardId: string) => 
      survey ? deleteRewardLink(survey.id, rewardId) : Promise.reject('No survey'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reward-links-paged', survey?.id] })
      notifications.success('Reward Link Deleted', 'Reward link has been deleted successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to delete reward link'
      notifications.error('Delete Failed', errorMessage)
    }
  })

  // Clear all reward links mutation
  const clearAllMutation = useMutation({
    mutationFn: () => 
      survey ? clearAllRewardLinks(survey.id) : Promise.reject('No survey'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reward-links-paged', survey?.id] })
      notifications.success('All Links Cleared', 'All reward links have been cleared successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to clear reward links'
      notifications.error('Clear Failed', errorMessage)
    }
  })

  // Import TXT mutation
  const importTxtMutation = useMutation({
    mutationFn: (txtData: string) => 
      survey ? importRewardLinks(survey.id, { txtData }) : Promise.reject('No survey'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reward-links-paged', survey?.id] })
      setTxtData('')
      
      // Show detailed import results
      if (result.imported === 0) {
        notifications.error('Import Failed', result.message)
      } else if (result.skipped === 0) {
        notifications.success('Import Complete', result.message)
      } else {
        notifications.success(
          'Import Partially Complete',
          `${result.message}${result.failedLinks.length > 0 ? ` (${result.failedLinks.length} failed links)` : ''}`
        )
      }
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to import reward links'
      notifications.error('Import Failed', errorMessage)
    }
  })

  // Handlers
  const handleDeleteLink = (rewardId: string) => {
    if (confirm('Are you sure you want to delete this reward link?')) {
      deleteLinkMutation.mutate(rewardId)
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL reward links? This action cannot be undone.')) {
      clearAllMutation.mutate()
    }
  }

  const handleImportFile = () => {
    if (!txtData.trim()) {
      notifications.error('Validation Error', 'Please select a file to import')
      return
    }

    // Basic validation - check if it looks like text format (one link per line)
    const lines = txtData.trim().split('\n')
    const validLines = lines.filter(line => line.trim().length > 0)
    
    if (validLines.length === 0) {
      notifications.error('Validation Error', 'No valid links found in selected file')
      return
    }

    importTxtMutation.mutate(txtData.trim())
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.txt')) {
      notifications.error('Invalid File Type', 'Please select a .txt file')
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setTxtData(content)
        notifications.success('File Loaded', `Loaded ${content.split('\n').filter(line => line.trim()).length} links from ${file.name}`)
      }
    }
    reader.onerror = () => {
      notifications.error('File Error', 'Failed to read file')
      setSelectedFile(null)
      setTxtData('')
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setTxtData('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      notifications.success('Copied', 'Link copied to clipboard')
    }
  }

  const handleSearch = (searchTerm: string) => {
    setPagination(prev => ({
      ...prev,
      search: searchTerm,
      offset: 0 // Reset to first page when searching
    }))
  }

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }))
  }

  return {
    // State
    txtData,
    setTxtData,
    selectedFile,
    setSelectedFile,
    activeTab,
    setActiveTab,
    pagination,
    setPagination,
    fileInputRef,
    
    // Data
    rewardData,
    isLoading,
    error,
    
    // Mutations
    deleteLinkMutation,
    clearAllMutation,
    importTxtMutation,
    
    // Handlers
    handleDeleteLink,
    handleClearAll,
    handleImportFile,
    handleFileSelect,
    handleFileUpload,
    handleRemoveFile,
    copyToClipboard,
    handleSearch,
    handlePageChange,
  }
}