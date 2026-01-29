'use client'

import { useState } from 'react'
import { ConfigUIProps } from '@/src/core/interfaces/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Slider } from '@/components/ui/slider'

interface BringIdConfig {
  minScore: number
  requireHumanityProof: boolean
}

const DEFAULT_CONFIG: BringIdConfig = {
  minScore: 50,
  requireHumanityProof: false
}

export function BringIdConfigUI({ config, onChange }: ConfigUIProps) {
  const bringIdConfig: BringIdConfig = {
    ...DEFAULT_CONFIG,
    ...(config || {})
  }

  const [localMinScore, setLocalMinScore] = useState<string>(String(bringIdConfig.minScore))
  const [error, setError] = useState<string | null>(null)

  const handleMinScoreChange = (value: string) => {
    setLocalMinScore(value)
    setError(null)

    const numValue = parseInt(value, 10)

    if (isNaN(numValue)) {
      setError('Please enter a valid number')
      return
    }

    if (numValue < 0 || numValue > 100) {
      setError('Score must be between 0 and 100')
      return
    }

    onChange({
      ...bringIdConfig,
      minScore: numValue
    })
  }

  const handleSliderChange = (values: number[]) => {
    const value = values[0]
    setLocalMinScore(String(value))
    setError(null)
    onChange({
      ...bringIdConfig,
      minScore: value
    })
  }

  const handleHumanityProofToggle = (checked: boolean) => {
    onChange({
      ...bringIdConfig,
      requireHumanityProof: checked
    })
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-medium text-zinc-900">BringId Configuration</h3>
          <p className="text-sm text-zinc-600 mt-1">
            Configure reputation score requirements for survey access
          </p>
        </div>

        {/* Minimum Score */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="min-score">Minimum Reputation Score</Label>
            <p className="text-xs text-zinc-500 mt-0.5">
              Users must have at least this score to access the survey (0-100)
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Slider
              value={[bringIdConfig.minScore]}
              onValueChange={handleSliderChange}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <Input
              id="min-score"
              type="number"
              min={0}
              max={100}
              value={localMinScore}
              onChange={(e) => handleMinScoreChange(e.target.value)}
              className="w-20 text-center"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Score explanation */}
          <div className="bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600">
            <p className="font-medium mb-1">Score Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><span className="font-medium">0-30:</span> Very permissive, most users will pass</li>
              <li><span className="font-medium">31-50:</span> Moderate, filters out low-activity wallets</li>
              <li><span className="font-medium">51-70:</span> Strict, requires established on-chain history</li>
              <li><span className="font-medium">71-100:</span> Very strict, only highly reputable wallets</li>
            </ul>
          </div>
        </div>

        {/* Humanity Proof Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
          <div className="space-y-0.5">
            <Label htmlFor="humanity-proof">Require Humanity Proof</Label>
            <p className="text-xs text-zinc-500">
              Require users to complete additional verification
            </p>
          </div>
          <Switch
            id="humanity-proof"
            checked={bringIdConfig.requireHumanityProof}
            onCheckedChange={handleHumanityProofToggle}
          />
        </div>

        {/* Help text */}
        <div className="pt-4 border-t border-zinc-200">
          <p className="text-xs text-zinc-500">
            BringId verifies wallet reputation based on on-chain activity, transaction history,
            and identity verification. Higher scores indicate more established and trustworthy wallets.
          </p>
        </div>
      </div>
    </Card>
  )
}
