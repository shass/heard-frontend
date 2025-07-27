"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Survey } from "@/lib/types"

interface SurveyInfoProps {
  survey: Survey
  eligibility?: {
    isEligible: boolean
    hasCompleted: boolean
    reason?: string
  }
}

export function SurveyInfo({ survey, eligibility }: SurveyInfoProps) {
  const hasCompleted = eligibility?.hasCompleted

  return (
    <div className="space-y-6">
      {/* Detailed Description */}
      <Card>
        <CardHeader>
          <CardTitle>About This Survey</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-700 whitespace-pre-wrap">{survey.detailedDescription}</p>
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Eligibility Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-700 whitespace-pre-wrap">{survey.criteria}</p>
        </CardContent>
      </Card>

      {/* Eligibility Status */}
      {eligibility && (
        <Card>
          <CardHeader>
            <CardTitle>Your Eligibility Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hasCompleted ? (
                <Alert>
                  <AlertDescription>
                    You have already completed this survey. Thank you for your participation!
                  </AlertDescription>
                </Alert>
              ) : eligibility.isEligible ? (
                <Alert>
                  <AlertDescription>
                    You are eligible to take this survey.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>
                    {eligibility.reason || "You are not eligible for this survey."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}