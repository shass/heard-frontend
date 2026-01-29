'use client'

import { AccessInstructionsProps } from '@/src/core/interfaces/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

/**
 * BringId Instructions Component
 *
 * Displayed to users when they don't meet the BringId requirements.
 * Shows what they need to do to gain access.
 */
export function BringIdInstructions({ requiresAction }: AccessInstructionsProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-zinc-900">BringId Verification Required</h3>
          <p className="text-sm text-zinc-600 mt-1">
            {requiresAction?.instructions || 'Your wallet does not meet the reputation requirements for this survey.'}
          </p>
        </div>

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
