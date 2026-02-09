'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { IdCard } from 'lucide-react'

export interface BringIdConfig {
  minScore: number
  requireHumanityProof: boolean
  minPoints?: number
  combineMode?: 'AND' | 'OR'
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
      // Reset combineMode when score becomes irrelevant (0)
      combineMode: clampedValue > 0 ? config.combineMode : undefined,
    })
  }

  const handleHumanityProofChange = (checked: boolean) => {
    onConfigChange({
      ...config,
      requireHumanityProof: checked,
      // Reset minPoints and combineMode when disabling humanity proof
      minPoints: checked ? (config.minPoints ?? 0) : undefined,
      combineMode: checked ? config.combineMode : undefined,
    })
  }

  const handleMinPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    const clampedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value))
    onConfigChange({
      ...config,
      minPoints: clampedValue,
    })
  }

  const handleCombineModeChange = (value: 'AND' | 'OR') => {
    onConfigChange({
      ...config,
      combineMode: value,
    })
  }

  const showCombineMode = config.minScore > 0 && config.requireHumanityProof

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

          <div className="space-y-3">
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

            {showCombineMode && (
              <div className="ml-4">
                <Separator className="my-3" />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Score & Points Combine Mode</Label>
                  <RadioGroup
                    value={config.combineMode ?? 'AND'}
                    onValueChange={(val) => handleCombineModeChange(val as 'AND' | 'OR')}
                    disabled={disabled}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="AND" id="bringid-combine-and" />
                      <Label htmlFor="bringid-combine-and" className="font-normal cursor-pointer">
                        <span className="font-medium">AND</span>
                        <span className="text-muted-foreground ml-2">
                          - Both score and humanity points must meet minimum
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="OR" id="bringid-combine-or" />
                      <Label htmlFor="bringid-combine-or" className="font-normal cursor-pointer">
                        <span className="font-medium">OR</span>
                        <span className="text-muted-foreground ml-2">
                          - Either score or humanity points can grant access
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Separator className="my-3" />
              </div>
            )}

            <div className="ml-7 space-y-2">
              <Label htmlFor="minPoints" className={!config.requireHumanityProof ? 'text-muted-foreground' : ''}>
                Minimum Humanity Points (0-100)
              </Label>
              <Input
                id="minPoints"
                type="number"
                min={0}
                max={100}
                value={config.minPoints ?? 0}
                onChange={handleMinPointsChange}
                disabled={disabled || !config.requireHumanityProof}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Users must have at least this many humanity points to access the survey
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
