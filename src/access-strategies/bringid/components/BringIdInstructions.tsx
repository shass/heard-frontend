'use client'

import { AccessInstructionsProps } from '@/src/core/interfaces/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useHumanityVerification } from '@/hooks/use-humanity-verification'

interface BringIdInstructionsProps extends AccessInstructionsProps {
  walletAddress?: string
  requiresHumanityVerification?: boolean
  onVerificationComplete?: () => void
}

/**
 * BringId Instructions Component
 *
 * Displayed to users when they don't meet the BringId requirements.
 * Shows what they need to do to gain access.
 */
export function BringIdInstructions({
  requiresAction,
  user,
  walletAddress,
  requiresHumanityVerification,
  onVerificationComplete,
}: BringIdInstructionsProps) {
  const { isVerifying, result, verify } = useHumanityVerification()

  // Get wallet address from user if not provided directly
  const effectiveWalletAddress = walletAddress ?? user?.walletAddress
  // Check requiresHumanityVerification from both props and requiresAction
  const needsHumanityVerification = requiresHumanityVerification ??
    (requiresAction as any)?.requiresHumanityVerification ?? false

  const handleVerifyClick = async () => {
    if (!effectiveWalletAddress) return

    const verificationResult = await verify(effectiveWalletAddress)
    if (verificationResult.verified && onVerificationComplete) {
      onVerificationComplete()
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-zinc-900">BringId Verification Required</h3>
          <p className="text-sm text-zinc-600 mt-1">
            {requiresAction?.instructions || 'Your wallet does not meet the reputation requirements for this survey.'}
          </p>
        </div>

        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{result.error}</p>
          </div>
        )}

        {result?.verified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">Verification successful!</p>
          </div>
        )}

        {needsHumanityVerification && effectiveWalletAddress && (
          <Button
            className="w-full"
            onClick={handleVerifyClick}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Now'
            )}
          </Button>
        )}

        <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-700">To increase your BringId score:</p>
          <ul className="list-disc list-inside text-sm text-zinc-600 space-y-2">
            <li>Build on-chain transaction history</li>
            <li>Connect verified social accounts</li>
            <li>Complete identity verification at BringId</li>
            <li>Participate in verified communities</li>
          </ul>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open('https://bringid.io', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Visit BringId to Verify
        </Button>

        <p className="text-xs text-zinc-500 text-center">
          After verification, return here and try again.
        </p>
      </div>
    </Card>
  )
}
