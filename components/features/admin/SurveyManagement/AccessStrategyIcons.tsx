'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Globe, Users, IdCard, MessageCircle } from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'

interface AccessStrategyIconsProps {
  survey: AdminSurveyListItem
  onManageWhitelist: (survey: AdminSurveyListItem) => void
  onUpdateAccessConfig: (
    surveyId: string,
    strategyId: string,
    config: Record<string, unknown>
  ) => Promise<void>
}

interface BringIdPopoverContentProps {
  surveyId: string
  currentConfig?: {
    minScore?: number
    requireHumanityProof?: boolean
    minPoints?: number
  }
  onUpdateAccessConfig: (
    surveyId: string,
    strategyId: string,
    config: Record<string, unknown>
  ) => Promise<void>
  onClose: () => void
}

function BringIdPopoverContent({
  surveyId,
  currentConfig,
  onUpdateAccessConfig,
  onClose
}: BringIdPopoverContentProps) {
  const [minScore, setMinScore] = useState(currentConfig?.minScore ?? 50)
  const [requireHumanityProof, setRequireHumanityProof] = useState(currentConfig?.requireHumanityProof ?? false)
  const [minPoints, setMinPoints] = useState(currentConfig?.minPoints ?? 0)
  const [isSaving, setIsSaving] = useState(false)

  const handleHumanityProofChange = (checked: boolean) => {
    setRequireHumanityProof(checked)
    if (!checked) {
      setMinPoints(0)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const config: Record<string, unknown> = {
        minScore,
        requireHumanityProof
      }
      if (requireHumanityProof) {
        config.minPoints = minPoints
      }
      await onUpdateAccessConfig(surveyId, 'bringid', config)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-2">
        <Label htmlFor="bringid-min-score">Min Score: {minScore}</Label>
        <Slider
          id="bringid-min-score"
          value={[minScore]}
          onValueChange={(value) => setMinScore(value[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="humanity-proof"
          checked={requireHumanityProof}
          onCheckedChange={(checked) =>
            handleHumanityProofChange(checked === true)
          }
        />
        <Label htmlFor="humanity-proof" className="cursor-pointer">
          Require Humanity Proof
        </Label>
      </div>

      {requireHumanityProof && (
        <div className="space-y-2 ml-6">
          <Label htmlFor="bringid-min-points">Min Points: {minPoints}</Label>
          <Slider
            id="bringid-min-points"
            value={[minPoints]}
            onValueChange={(value) => setMinPoints(value[0])}
            min={0}
            max={100}
            step={1}
          />
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}

interface NeynarPopoverContentProps {
  surveyId: string
  currentConfig?: {
    minScore?: number
  }
  onUpdateAccessConfig: (
    surveyId: string,
    strategyId: string,
    config: Record<string, unknown>
  ) => Promise<void>
  onClose: () => void
}

function NeynarPopoverContent({
  surveyId,
  currentConfig,
  onUpdateAccessConfig,
  onClose
}: NeynarPopoverContentProps) {
  const [minScore, setMinScore] = useState(currentConfig?.minScore ?? 50)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdateAccessConfig(surveyId, 'neynar', { minScore })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-2">
        <Label htmlFor="neynar-min-score">Min Score: {minScore}</Label>
        <Slider
          id="neynar-min-score"
          value={[minScore]}
          onValueChange={(value) => setMinScore(value[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>

      <Button
        size="sm"
        className="w-full"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}

export function AccessStrategyIcons({
  survey,
  onManageWhitelist,
  onUpdateAccessConfig
}: AccessStrategyIconsProps) {
  const [bringIdOpen, setBringIdOpen] = useState(false)
  const [neynarOpen, setNeynarOpen] = useState(false)

  const strategies = survey.accessStrategyIds ?? []

  if (strategies.length === 0) {
    return <span className="text-sm text-gray-500">No restrictions</span>
  }

  return (
    <div className="flex items-center gap-1">
      {strategies.includes('public') && (
        <Badge variant="outline" className="gap-1">
          <Globe className="w-3 h-3" />
          <span className="text-xs">Public</span>
        </Badge>
      )}

      {strategies.includes('whitelist') && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2"
          onClick={() => onManageWhitelist(survey)}
          title="Manage Whitelist"
        >
          <Users className="w-3 h-3" />
          <span className="text-xs">Whitelist</span>
        </Button>
      )}

      {strategies.includes('bringid') && (
        <Popover open={bringIdOpen} onOpenChange={setBringIdOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2"
              title="BringID Configuration"
            >
              <IdCard className="w-3 h-3" />
              <span className="text-xs">BringID</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <BringIdPopoverContent
              surveyId={survey.id}
              currentConfig={survey.accessStrategyConfigs?.bringid?.config as { minScore?: number; requireHumanityProof?: boolean; minPoints?: number } | undefined}
              onUpdateAccessConfig={onUpdateAccessConfig}
              onClose={() => setBringIdOpen(false)}
            />
          </PopoverContent>
        </Popover>
      )}

      {strategies.includes('neynar') && (
        <Popover open={neynarOpen} onOpenChange={setNeynarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2"
              title="Neynar Configuration"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">Neynar</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <NeynarPopoverContent
              surveyId={survey.id}
              currentConfig={survey.accessStrategyConfigs?.neynar?.config as { minScore?: number } | undefined}
              onUpdateAccessConfig={onUpdateAccessConfig}
              onClose={() => setNeynarOpen(false)}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
