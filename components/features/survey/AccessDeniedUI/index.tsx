'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldX, ArrowLeft, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AccessDeniedUIProps {
  reason?: string | null
  surveyName?: string
  onBack?: () => void
}

export function AccessDeniedUI({ reason, surveyName, onBack }: AccessDeniedUIProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            {surveyName && `You don't have access to "${surveyName}"`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>Access Requirement Not Met</AlertTitle>
            <AlertDescription>
              {reason || 'You do not meet the requirements to access this survey.'}
            </AlertDescription>
          </Alert>

          <div className="pt-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              This survey has specific access requirements. Common reasons for denial include:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Not on the survey whitelist</li>
              <li>Missing required NFT or token holdings</li>
              <li>Insufficient HeardPoints balance</li>
              <li>Already completed this survey</li>
            </ul>
          </div>

          <Button onClick={handleBack} className="w-full" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Surveys
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
