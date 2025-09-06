'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthActions } from '@/components/providers/auth-provider'
import {
  getAdminSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  toggleSurveyStatus,
  duplicateSurvey,
  importSurveys,
  exportSurvey,
  refreshSurveyStats
} from '@/lib/api/admin'
import { useNotifications } from '@/components/ui/notifications'
import type { AdminSurveyListItem, CreateSurveyRequest, UpdateSurveyRequest } from '@/lib/types'

export function useSurveyManagement() {
  const { isAuthenticated, user } = useAuthActions()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedSurvey, setSelectedSurvey] = useState<AdminSurveyListItem | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResponsesDialogOpen, setIsResponsesDialogOpen] = useState(false)
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false)
  const [isRewardLinksModalOpen, setIsRewardLinksModalOpen] = useState(false)
  const [isSurveyClientsModalOpen, setIsSurveyClientsModalOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{
    imported: number
    failed: number
    errors?: Array<{ survey: string, error: string }>
  } | null>(null)

  const notifications = useNotifications()
  const queryClient = useQueryClient()

  const { data: surveysData, isLoading, error } = useQuery({
    queryKey: ['admin-surveys', { search: searchTerm, status: statusFilter }],
    queryFn: () => getAdminSurveys({
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 50
    }),
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 30000
  })

  const createSurveyMutation = useMutation({
    mutationFn: createSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      setIsCreateDialogOpen(false)
      notifications.success('Survey Created', 'Survey has been created successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to create survey'
      notifications.error('Creation Failed', errorMessage)
    }
  })

  const updateSurveyMutation = useMutation({
    mutationFn: updateSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      setIsEditDialogOpen(false)
      setSelectedSurvey(null)
      notifications.success('Survey Updated', 'Survey has been updated successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to update survey'
      notifications.error('Update Failed', errorMessage)
    }
  })

  const deleteSurveyMutation = useMutation({
    mutationFn: deleteSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      notifications.success('Survey Deleted', 'Survey has been deleted successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to delete survey'
      notifications.error('Deletion Failed', errorMessage)
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ surveyId, isActive }: { surveyId: string, isActive: boolean }) =>
      toggleSurveyStatus(surveyId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to update survey status'
      notifications.error('Status Update Failed', errorMessage)
    }
  })

  const duplicateSurveyMutation = useMutation({
    mutationFn: ({ surveyId, newName }: { surveyId: string, newName: string }) =>
      duplicateSurvey(surveyId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      notifications.success('Survey Duplicated', 'Survey has been duplicated successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to duplicate survey'
      notifications.error('Duplication Failed', errorMessage)
    }
  })

  const refreshStatsMutation = useMutation({
    mutationFn: (surveyId?: string) => refreshSurveyStats(surveyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      notifications.success('Statistics Refreshed', data.message)
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to refresh statistics'
      notifications.error('Refresh Failed', errorMessage)
    }
  })

  const importSurveysMutation = useMutation({
    mutationFn: importSurveys,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      setImportResults(data)
      notifications.success('Import Completed', `Successfully imported ${data.imported} surveys`)
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to import surveys'
      notifications.error('Import Failed', errorMessage)
      setImportResults(null)
    }
  })

  const exportSurveyMutation = useMutation({
    mutationFn: exportSurvey,
    onSuccess: (data, surveyId) => {
      const surveys = surveysData?.surveys || []
      const survey = surveys.find(s => s.id === surveyId)
      const filename = `${survey?.name || 'survey'}_export.json`
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      notifications.success('Export Completed', `Survey exported as ${filename}`)
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to export survey'
      notifications.error('Export Failed', errorMessage)
    }
  })

  const handleCreateSurvey = (data: CreateSurveyRequest | UpdateSurveyRequest) => {
    createSurveyMutation.mutate(data as CreateSurveyRequest)
  }

  const handleUpdateSurvey = (data: CreateSurveyRequest | UpdateSurveyRequest) => {
    updateSurveyMutation.mutate(data as UpdateSurveyRequest)
  }

  const handleDeleteSurvey = (surveyId: string) => {
    if (confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      deleteSurveyMutation.mutate(surveyId)
    }
  }

  const handleToggleStatus = (surveyId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ surveyId, isActive: !currentStatus })
  }

  const handleDuplicateSurvey = (surveyId: string, currentName: string) => {
    const newName = prompt('Enter name for the duplicated survey:', `${currentName} (Copy)`)
    if (newName) {
      duplicateSurveyMutation.mutate({ surveyId, newName })
    }
  }

  const handleExportSurvey = (surveyId: string) => {
    exportSurveyMutation.mutate(surveyId)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/json') {
      setImportFile(file)
      setImportResults(null)
    } else {
      notifications.error('Invalid File', 'Please select a valid JSON file')
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      notifications.error('No File Selected', 'Please select a JSON file to import')
      return
    }

    try {
      const fileContent = await importFile.text()
      const jsonData = JSON.parse(fileContent)
      
      if (!jsonData.surveys || !Array.isArray(jsonData.surveys)) {
        notifications.error('Invalid Format', 'JSON file must contain a "surveys" array')
        return
      }

      importSurveysMutation.mutate(jsonData)
    } catch (error) {
      notifications.error('File Error', 'Failed to read or parse the JSON file')
    }
  }

  const resetImport = () => {
    setImportFile(null)
    setImportResults(null)
    setIsImportDialogOpen(false)
  }

  return {
    // State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedSurvey,
    setSelectedSurvey,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isResponsesDialogOpen,
    setIsResponsesDialogOpen,
    isWhitelistModalOpen,
    setIsWhitelistModalOpen,
    isRewardLinksModalOpen,
    setIsRewardLinksModalOpen,
    isSurveyClientsModalOpen,
    setIsSurveyClientsModalOpen,
    isImportDialogOpen,
    setIsImportDialogOpen,
    importFile,
    importResults,

    // Data
    surveys: surveysData?.surveys || [],
    isLoading,
    error,

    // Mutations
    createSurveyMutation,
    updateSurveyMutation,
    deleteSurveyMutation,
    toggleStatusMutation,
    duplicateSurveyMutation,
    refreshStatsMutation,
    importSurveysMutation,
    exportSurveyMutation,

    // Handlers
    handleCreateSurvey,
    handleUpdateSurvey,
    handleDeleteSurvey,
    handleToggleStatus,
    handleDuplicateSurvey,
    handleExportSurvey,
    handleFileSelect,
    handleImport,
    resetImport
  }
}