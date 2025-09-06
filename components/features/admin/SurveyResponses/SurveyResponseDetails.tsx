import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye } from 'lucide-react'
import type { AdminSurveyResponse } from '@/lib/types'

interface SurveyResponseDetailsProps {
  response: AdminSurveyResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SurveyResponseDetails({ response, open, onOpenChange }: SurveyResponseDetailsProps) {
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