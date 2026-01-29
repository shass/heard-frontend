'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IdCard } from 'lucide-react'

export interface BringIdConfig {
  minScore: number
  requireHumanityProof: boolean
}

interface BringIdConfigCardProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  config: BringIdConfig
  onConfigChange: (config: BringIdConfig) => void
  disabled?: boolean
}

export function BringIdConfigCard({
  enabled,
  onEnabledChange,
  config,
  onConfigChange,
  disabled,
}: BringIdConfigCardProps) {
  const handleMinScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    const clampedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value))
    onConfigChange({
      ...config,
      minScore: clampedValue,
    })
  }

  const handleHumanityProofChange = (checked: boolean) => {
    onConfigChange({
      ...config,
      requireHumanityProof: checked,
    })
  }

  return (
    <Card className={!enabled ? 'opacity-60' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="bringid-enabled"
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(checked === true)}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">BringId Reputation</CardTitle>
          </div>
        </div>
        <CardDescription className="ml-7">
          Verify identity and reputation via BringId score
        </CardDescription>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="minScore">Minimum Score (0-100)</Label>
            <Input
              id="minScore"
              type="number"
              min={0}
              max={100}
              value={config.minScore}
              onChange={handleMinScoreChange}
              disabled={disabled}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Users must have a BringId score of at least this value to access the survey
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="requireHumanityProof"
              checked={config.requireHumanityProof}
              onCheckedChange={(checked) => handleHumanityProofChange(checked === true)}
              disabled={disabled}
            />
            <div>
              <Label htmlFor="requireHumanityProof" className="cursor-pointer">
                Require Humanity Proof
              </Label>
              <p className="text-xs text-muted-foreground">
                Require users to complete BringId humanity verification
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
