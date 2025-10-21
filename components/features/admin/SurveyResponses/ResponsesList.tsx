import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/loading-states'
import { Eye, Calendar, Clock, Trash2 } from 'lucide-react'
import type { AdminSurveyResponse } from '@/lib/types'

interface ResponsesListProps {
  responses: AdminSurveyResponse[]
  isLoading: boolean
  error: Error | null
  onViewDetails: (response: AdminSurveyResponse) => void
  onDelete: (response: AdminSurveyResponse) => void
}

export function ResponsesList({
  responses,
  isLoading,
  error,
  onViewDetails,
  onDelete
}: ResponsesListProps) {
  return (
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

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(response)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(response)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete response (allows user to retake survey)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ScrollArea>
  )
}