'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldX, ArrowLeft, Lock, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BringIdInstructions } from '@/src/access-strategies/bringid/components/BringIdInstructions'

interface BringIdConfig {
  minScore?: number
  requireHumanityProof?: boolean
}

interface AccessStrategyConfig {
  enabled: boolean
  config: BringIdConfig | Record<string, unknown>
}

interface AccessDeniedUIProps {
  reason?: string | null
  surveyName?: string
  onBack?: () => void
  onRetry?: () => void
  accessStrategies?: string[]
  accessStrategyConfigs?: Record<string, AccessStrategyConfig>
  walletAddress?: string
  onVerificationComplete?: () => void
}

export function AccessDeniedUI({
  reason,
  surveyName,
  onBack,
  onRetry,
  accessStrategies,
  accessStrategyConfigs,
  walletAddress,
  onVerificationComplete
}: AccessDeniedUIProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/')
    }
  }

  // Check if BringId strategy is in use
  const hasBringIdStrategy = accessStrategies?.includes('bringid')

  // Get BringId config to check if humanity verification is required
  const bringIdConfig = accessStrategyConfigs?.bringid?.config as BringIdConfig | undefined
  const requiresHumanityVerification = bringIdConfig?.requireHumanityProof ?? false

  // If BringId strategy failed, show verification UI
  if (hasBringIdStrategy) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldX className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Verification Required</CardTitle>
              <CardDescription>
                {surveyName && `Complete verification to access "${surveyName}"`}
              </CardDescription>
            </CardHeader>
          </Card>

          <BringIdInstructions
            survey={null}
            user={null}
            requiresAction={{ type: 'follow', instructions: reason || 'Your wallet needs BringId verification' }}
            walletAddress={walletAddress}
            requiresHumanityVerification={requiresHumanityVerification}
            onVerificationComplete={onVerificationComplete}
          />

          <div className="flex gap-2">
            <Button onClick={handleBack} className="flex-1" variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {onRetry && (
              <Button onClick={onRetry} className="flex-1" variant="secondary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Check
              </Button>
            )}
          </div>
        </div>
      </div>
    )
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
