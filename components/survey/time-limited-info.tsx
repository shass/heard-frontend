"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink } from "lucide-react"
import type { Survey } from "@/lib/types"

interface TimeLimitedInfoProps {
  survey: Survey
}

export function TimeLimitedInfo({ survey }: TimeLimitedInfoProps) {
  // Only show for time-limited surveys
  if (survey.surveyType !== 'time_limited') return null
  if (!survey.endDate) return null

  const now = new Date()
  const endDate = new Date(survey.endDate)
  const isEnded = now >= endDate

  // Format end date with user's timezone
  const formattedEndDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(endDate)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Survey Timing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!isEnded && (
            <div>
              <p className="text-sm text-zinc-600 mb-1">This survey will end on:</p>
              <p className="text-lg font-semibold text-zinc-900">{formattedEndDate}</p>
            </div>
          )}

          {isEnded && survey.resultsPageUrl && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">This survey has ended.</p>
              <Button asChild className="w-full sm:w-auto">
                <a href={survey.resultsPageUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Results
                </a>
              </Button>
            </div>
          )}

          {isEnded && !survey.resultsPageUrl && (
            <div>
              <p className="text-sm text-zinc-600">This survey has ended.</p>
              <p className="text-sm text-zinc-500 mt-1">Results will be available soon.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
