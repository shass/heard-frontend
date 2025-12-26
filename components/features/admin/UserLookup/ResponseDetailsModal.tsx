'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import { CheckCircle, Clock, Star } from 'lucide-react'
import { ResponseStatus, type WalletResponseDetails } from '@/lib/types'

interface ResponseDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  details: WalletResponseDetails | undefined
  isLoading: boolean
  error: Error | null
}

export function ResponseDetailsModal({
  isOpen,
  onClose,
  details,
  isLoading,
  error
}: ResponseDetailsModalProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Survey Response Details
            {details && (
              <Badge variant={details.status === ResponseStatus.COMPLETED ? 'default' : 'secondary'}>
                {details.status === ResponseStatus.COMPLETED ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Completed</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> In Progress</>
                )}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>Failed to load response details</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {details && !isLoading && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg">{details.surveyName}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Started</p>
                  <p>{formatDate(details.startedAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p>{formatDate(details.completedAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    HeardPoints
                  </p>
                  <p className="font-medium">{details.heardPointsAwarded}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Answers</p>
                  <p>{details.answers.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Answers</h4>
              {details.answers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No answers submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {details.answers.map((answer, index) => (
                    <div key={answer.questionId} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="bg-muted px-2 py-0.5 rounded text-sm font-medium">
                          Q{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {answer.questionType}
                        </Badge>
                      </div>
                      <p className="font-medium mb-2">{answer.questionText}</p>
                      <div className="space-y-1">
                        {answer.selectedAnswers.map((selected) => (
                          <div
                            key={selected.id}
                            className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {selected.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
