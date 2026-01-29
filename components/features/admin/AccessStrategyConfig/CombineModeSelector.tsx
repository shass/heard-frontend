'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type CombineMode = 'AND' | 'OR'

interface CombineModeSelectorProps {
  value: CombineMode
  onChange: (value: CombineMode) => void
  disabled?: boolean
}

export function CombineModeSelector({
  value,
  onChange,
  disabled
}: CombineModeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Combine Mode</Label>
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as CombineMode)}
        disabled={disabled}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="AND" id="combine-and" />
          <Label htmlFor="combine-and" className="font-normal cursor-pointer">
            <span className="font-medium">AND</span>
            <span className="text-muted-foreground ml-2">
              - All selected strategies must pass
            </span>
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="OR" id="combine-or" />
          <Label htmlFor="combine-or" className="font-normal cursor-pointer">
            <span className="font-medium">OR</span>
            <span className="text-muted-foreground ml-2">
              - Any one strategy can grant access
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
