'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getAdminSurveys, 
  createSurvey, 
  updateSurvey, 
  deleteSurvey, 
  toggleSurveyStatus,
  duplicateSurvey 
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
  Eye, 
  Copy, 
  Play, 
  Pause,
  Search,
  Filter,
  Download,
  Users
} from 'lucide-react'
import { SurveyForm } from './survey-form'
import { SurveyResponses } from './survey-responses'
import type { AdminSurveyListItem, CreateSurveyRequest, UpdateSurveyRequest } from '@/lib/types'

export function SurveyManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedSurvey, setSelectedSurvey] = useState<AdminSurveyListItem | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResponsesDialogOpen, setIsResponsesDialogOpen] = useState(false)

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
      notifications.error('Creation Failed', error.message || 'Failed to create survey')
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
      notifications.error('Update Failed', error.message || 'Failed to update survey')
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
      notifications.error('Deletion Failed', error.message || 'Failed to delete survey')
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
      notifications.error('Status Update Failed', error.message || 'Failed to update survey status')
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
      notifications.error('Duplication Failed', error.message || 'Failed to duplicate survey')
    }
  })

  const handleCreateSurvey = (data: CreateSurveyRequest) => {
    createSurveyMutation.mutate(data)
  }

  const handleUpdateSurvey = (data: UpdateSurveyRequest) => {
    updateSurveyMutation.mutate(data)
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
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Responses:</span>
                  <div className="font-medium">{survey.responseCount}</div>
                </div>
                <div>
                  <span className="text-gray-500">Reward:</span>
                  <div className="font-medium">{survey.rewardAmount} ETH</div>
                </div>
                <div>
                  <span className="text-gray-500">HerdPoints:</span>
                  <div className="font-medium">{survey.herdPointsReward} HP</div>
                </div>
                <div>
                  <span className="text-gray-500">Whitelist:</span>
                  <div className="font-medium">{survey.whitelistCount || 0} users</div>
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
                >
                  <Copy className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteSurvey(survey.id)}
                  disabled={deleteSurveyMutation.isPending}
                  className="text-red-600 hover:text-red-700"
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
    </div>
  )
}