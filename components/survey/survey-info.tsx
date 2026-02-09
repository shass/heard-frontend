"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Survey } from "@/lib/types"

interface SurveyInfoProps {
  survey: Survey
  eligibility?: {
    isEligible: boolean
    hasCompleted: boolean
    reason?: string
  }
  isEligibilityLoading?: boolean
  isConnected?: boolean
  requiresVerification?: boolean
}

export function SurveyInfo({ survey, eligibility, isEligibilityLoading, isConnected, requiresVerification }: SurveyInfoProps) {
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
      <Card>
        <CardHeader>
          <CardTitle>Your Eligibility Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!isConnected ? (
              <p className="text-zinc-500">Connect your wallet to check eligibility.</p>
            ) : isEligibilityLoading || !eligibility ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking your eligibility...</span>
              </div>
            ) : hasCompleted ? (
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
              <Alert variant={requiresVerification ? "default" : "destructive"}>
                <AlertDescription>
                  {eligibility.reason || "You are not eligible for this survey."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}