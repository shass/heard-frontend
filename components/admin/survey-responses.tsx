'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSurveyResponses } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/loading-states'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Eye,
  Download,
  User,
  Calendar,
  Clock
} from 'lucide-react'
import type { SurveyResponse, AdminSurveyResponse, AdminSurveyListItem } from '@/lib/types'

interface SurveyResponsesProps {
  survey: AdminSurveyListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SurveyResponses({ survey, open, onOpenChange }: SurveyResponsesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<AdminSurveyResponse | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const { data: responsesData, isLoading, error } = useQuery({
    queryKey: ['survey-responses', survey.id, { search: searchTerm }],
    queryFn: () => getSurveyResponses(survey.id, { search: searchTerm }),
    enabled: open, // Only fetch when dialog is open
  })

  const responses = responsesData?.responses || []

  const handleViewDetails = (response: AdminSurveyResponse) => {
    setSelectedResponse(response)
    setIsDetailDialogOpen(true)
  }

  const handleExportResponses = () => {
    // TODO: Implement CSV export
    console.log('Exporting responses for survey:', survey.id)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Survey Responses: {survey.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header with search and export */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by wallet address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleExportResponses}
                className="shrink-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{responses.length}</div>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {responses.filter(r => r.completedAt).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {responses.filter(r => !r.completedAt).length}
                  </div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Responses List */}
            <ScrollArea className="h-[400px] border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-32 text-red-600">
                  Error loading responses: {error.message}
                </div>
              ) : responses.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  No responses found
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {responses.map((response) => (
                    <Card key={response.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="font-mono text-sm font-medium">
                                {response.walletAddress}
                              </div>
                              <Badge 
                                variant={response.completedAt ? "default" : "secondary"}
                              >
                                {response.completedAt ? 'Completed' : 'In Progress'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Started: {new Date(response.createdAt).toLocaleDateString()}
                              </div>
                              {response.completedAt && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Completed: {new Date(response.completedAt).toLocaleDateString()}
                                </div>
                              )}
                              <div>
                                Questions answered: {response.responses?.length || 0}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(response)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Detail Dialog */}
      <SurveyResponseDetails
        response={selectedResponse}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </>
  )
}

interface SurveyResponseDetailsProps {
  response: AdminSurveyResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SurveyResponseDetails({ response, open, onOpenChange }: SurveyResponseDetailsProps) {
  if (!response) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Response Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Response Info */}
            <Card>
              <CardHeader>
                <CardTitle>Response Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Wallet Address:</span>
                    <div className="font-mono">{response.walletAddress}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div>
                      <Badge variant={response.completedAt ? "default" : "secondary"}>
                        {response.completedAt ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Started:</span>
                    <div>{new Date(response.createdAt).toLocaleString()}</div>
                  </div>
                  {response.completedAt && (
                    <div>
                      <span className="font-medium text-gray-600">Completed:</span>
                      <div>{new Date(response.completedAt).toLocaleString()}</div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Questions Answered:</span>
                    <div>{response.responses?.length || 0}</div>
                  </div>
                  {response.heardPointsAwarded && (
                    <div>
                      <span className="font-medium text-gray-600">HeardPoints Awarded:</span>
                      <div>{response.heardPointsAwarded} HP</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Answers */}
            <Card>
              <CardHeader>
                <CardTitle>Answers</CardTitle>
              </CardHeader>
              <CardContent>
                {response.responses && response.responses.length > 0 ? (
                  <div className="space-y-4">
                    {response.responses.map((answer, index) => (
                      <div key={answer.questionId} className="p-4 border rounded-lg">
                        <div className="font-medium mb-2">
                          {answer.questionOrder || index + 1}. {answer.questionText || 'Question text not available'} 
                          <span className="text-xs text-gray-400 ml-2">({answer.questionId})</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Selected answers:</strong>{' '}
                          {Array.isArray(answer.selectedAnswers) && answer.selectedAnswers.length > 0
                            ? answer.selectedAnswers.map((ans, idx) => (
                                <span key={idx}>
                                  {typeof ans === 'object' && ans !== null ? ans.text : String(ans)}
                                  {typeof ans === 'object' && ans !== null && (
                                    <span className="text-xs text-gray-400 ml-1">({ans.id})</span>
                                  )}
                                  {idx < answer.selectedAnswers.length - 1 && ', '}
                                </span>
                              ))
                            : 'No answers selected'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No answers recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
