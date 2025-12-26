'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle, Clock, Gift, Star, ExternalLink } from 'lucide-react'
import { ResponseStatus, type WalletSurveyResponse } from '@/lib/types'

interface SurveyResponsesListProps {
  responses: WalletSurveyResponse[]
  onSelectSurvey: (surveyId: string) => void
}

export function SurveyResponsesList({ responses, onSelectSurvey }: SurveyResponsesListProps) {
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

  if (responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Survey Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No survey responses found for this wallet address.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Survey Responses ({responses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {responses.map((response) => (
            <div
              key={response.responseId}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{response.surveyName}</h4>
                    <Badge variant={response.status === ResponseStatus.COMPLETED ? 'default' : 'secondary'}>
                      {response.status === ResponseStatus.COMPLETED ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Completed</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> In Progress</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{response.surveyCompany}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Started</p>
                      <p>{formatDate(response.startedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p>{formatDate(response.completedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <p>{response.questionsAnswered}/{response.totalQuestions} questions</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        HeardPoints
                      </p>
                      <p className="font-medium">{response.heardPointsAwarded}</p>
                    </div>
                  </div>

                  {response.reward && (
                    <div className="mt-3 p-2 bg-muted rounded flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Reward Assigned</p>
                        {response.reward.claimLink && (
                          <a
                            href={response.reward.claimLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View claim link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {response.reward.claimedAt && (
                          <p className="text-xs text-muted-foreground">
                            Claimed: {formatDate(response.reward.claimedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectSurvey(response.surveyId)}
                  className="ml-4"
                >
                  View Answers
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
