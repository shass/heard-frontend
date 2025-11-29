"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink } from "lucide-react"
import type { Survey } from "@/lib/types"
import type { ISurveyStrategy } from "@/lib/survey/strategies"

interface TimeLimitedInfoProps {
  survey: Survey
  strategy?: ISurveyStrategy | null
}

export function TimeLimitedInfo({ survey, strategy }: TimeLimitedInfoProps) {
  // Use strategy to determine if we should show dates
  const infoConfig = strategy?.getInfoConfig(survey)
  if (!infoConfig?.showDates) return null
  if (!survey.endDate) return null

  const now = new Date()
  const startDate = survey.startDate ? new Date(survey.startDate) : null
  const endDate = new Date(survey.endDate)
  const isEnded = now >= endDate
  const hasStarted = startDate ? now >= startDate : true

  // Date formatting options
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  const formattedStartDate = startDate
    ? new Intl.DateTimeFormat('en-US', dateFormatOptions).format(startDate)
    : null

  const formattedEndDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(endDate)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Survey Timing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Survey Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formattedStartDate && (
              <div>
                <p className="text-sm text-zinc-600 mb-1">Start Date:</p>
                <p className="text-base font-medium text-zinc-900">{formattedStartDate}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-zinc-600 mb-1">End Date:</p>
              <p className="text-base font-medium text-zinc-900">{formattedEndDate}</p>
            </div>
          </div>

          {/* Survey Status Messages */}
          {!hasStarted && (
            <div className="pt-2 border-t">
              <p className="text-sm text-amber-600 font-medium">This survey has not started yet.</p>
            </div>
          )}

          {hasStarted && !isEnded && (
            <div className="pt-2 border-t">
              <p className="text-sm text-green-600 font-medium">This survey is currently active.</p>
            </div>
          )}

          {isEnded && survey.resultsPageUrl && (
            <div className="space-y-3 pt-2 border-t">
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
            <div className="pt-2 border-t">
              <p className="text-sm text-zinc-600">This survey has ended.</p>
              <p className="text-sm text-zinc-500 mt-1">Results will be available soon.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
