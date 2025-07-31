'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAdminSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  toggleSurveyStatus,
  duplicateSurvey,
  importSurveys,
  exportSurvey
} from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import {
  PlusCircle,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Search,
  Filter,
  Users,
  List,
  Gift,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Crown
} from 'lucide-react'
import { SurveyForm } from './survey-form'
import { SurveyResponses } from './survey-responses'
import { WhitelistModal } from './whitelist-modal'
import { RewardLinksModal } from './reward-links-modal'
import { SurveyClientsModal } from './survey-clients-modal'
import type { AdminSurveyListItem, CreateSurveyRequest, UpdateSurveyRequest } from '@/lib/types'

export function SurveyManagement() {
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
      // Find survey name for filename
      const survey = surveys.find(s => s.id === surveyId)
      const filename = `${survey?.name || 'survey'}_export.json`
      
      // Create and download file
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Surveys</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  const surveys = surveysData?.surveys || []

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search surveys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Surveys</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Surveys
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Survey
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Survey</DialogTitle>
              </DialogHeader>
              <SurveyForm
                onSubmit={handleCreateSurvey}
                isLoading={createSurveyMutation.isPending}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Surveys Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {surveys.map((survey) => (
          <Card key={survey.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{survey.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{survey.company}</p>
                </div>
                <Badge variant={survey.isActive ? "default" : "secondary"}>
                  {survey.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 line-clamp-3">{survey.description}</p>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Responses:</span>
                    <div className="font-medium">{survey.responseCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Reward:</span>
                    <div className="font-medium">{survey.rewardAmount} {survey.rewardToken}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">HeardPoints:</span>
                    <div className="font-medium">{survey.heardPointsReward} HP</div>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">Whitelist:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-medium">{survey.whitelistCount || 0}</span>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-green-600">{survey.whitelistCompleted || 0}</span>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-gray-500">{survey.whitelistPending || 0}</span>
                    <span className="text-xs text-gray-400 ml-1">(total/completed/pending)</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">Reward Links:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-medium">{survey.rewardLinksTotal || 0}</span>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-green-600">{survey.rewardLinksAvailable || 0}</span>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium text-gray-500">{survey.rewardLinksUsed || 0}</span>
                    <span className="text-xs text-gray-400 ml-1">(total/available/used)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(survey.id, survey.isActive)}
                  disabled={toggleStatusMutation.isPending}
                >
                  {survey.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSurvey(survey)
                    setIsResponsesDialogOpen(true)
                  }}
                  title="View Responses"
                >
                  <Users className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSurvey(survey)
                    setIsWhitelistModalOpen(true)
                  }}
                  title="Manage Whitelist"
                >
                  <List className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSurvey(survey)
                    setIsRewardLinksModalOpen(true)
                  }}
                  title="Manage Reward Links"
                >
                  <Gift className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSurvey(survey)
                    setIsSurveyClientsModalOpen(true)
                  }}
                  title="Manage Survey Clients"
                >
                  <Crown className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSurvey(survey)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateSurvey(survey.id, survey.name)}
                  disabled={duplicateSurveyMutation.isPending}
                  title="Duplicate Survey"
                >
                  <Copy className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSurvey(survey.id)}
                  disabled={exportSurveyMutation.isPending}
                  title="Export Survey to JSON"
                >
                  <Download className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSurvey(survey.id)}
                  disabled={deleteSurveyMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                  title="Delete Survey"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {surveys.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first survey to get started.'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Survey
          </Button>
        </div>
      )}

      {/* Edit Survey Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
          </DialogHeader>
          {selectedSurvey && (
            <SurveyForm
              survey={selectedSurvey}
              onSubmit={handleUpdateSurvey}
              isLoading={updateSurveyMutation.isPending}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedSurvey(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Survey Responses Dialog */}
      {selectedSurvey && (
        <SurveyResponses
          survey={selectedSurvey}
          open={isResponsesDialogOpen}
          onOpenChange={(open) => {
            setIsResponsesDialogOpen(open)
            if (!open) {
              setSelectedSurvey(null)
            }
          }}
        />
      )}

      {/* Whitelist Management Modal */}
      <WhitelistModal
        survey={selectedSurvey}
        isOpen={isWhitelistModalOpen}
        onClose={() => {
          setIsWhitelistModalOpen(false)
          setSelectedSurvey(null)
        }}
      />

      {/* Reward Links Management Modal */}
      <RewardLinksModal
        survey={selectedSurvey}
        isOpen={isRewardLinksModalOpen}
        onClose={() => {
          setIsRewardLinksModalOpen(false)
          setSelectedSurvey(null)
        }}
      />

      {/* Survey Clients Management Modal */}
      <SurveyClientsModal
        survey={selectedSurvey}
        isOpen={isSurveyClientsModalOpen}
        onClose={() => {
          setIsSurveyClientsModalOpen(false)
          setSelectedSurvey(null)
        }}
      />

      {/* Import Surveys Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        if (!open) {
          resetImport()
        }
        setIsImportDialogOpen(open)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Surveys</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {!importResults ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select JSON File
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  {importFile && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        Selected: {importFile.name}
                      </span>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Expected Format:</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "surveys": [
    {
      "name": "Survey Name",
      "company": "Company Name", 
      "description": "Description",
      "detailedDescription": "Detailed description",
      "criteria": "Criteria",
      "rewardAmount": 0.01,
      "rewardToken": "ETH",
      "heardPointsReward": 50,
      "questions": [...],
      "whitelist": [...]
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={resetImport}
                    disabled={importSurveysMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!importFile || importSurveysMutation.isPending}
                  >
                    {importSurveysMutation.isPending ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Surveys
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium">Import Results</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-md">
                      <div className="text-2xl font-bold text-green-700">
                        {importResults.imported}
                      </div>
                      <div className="text-sm text-green-600">
                        Successfully Imported
                      </div>
                    </div>
                    
                    {importResults.failed > 0 && (
                      <div className="p-3 bg-red-50 rounded-md">
                        <div className="text-2xl font-bold text-red-700">
                          {importResults.failed}
                        </div>
                        <div className="text-sm text-red-600">
                          Failed to Import
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-700">Errors:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResults.errors.map((error, index) => (
                          <div key={index} className="p-2 bg-red-50 rounded text-sm">
                            <div className="font-medium text-red-700">
                              {error.survey}
                            </div>
                            <div className="text-red-600">
                              {error.error}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={resetImport}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
