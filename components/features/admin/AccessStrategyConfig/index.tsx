'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Globe, Users } from 'lucide-react'
import { CombineModeSelector, type CombineMode } from './CombineModeSelector'
import { BringIdConfigCard, type BringIdConfig } from './BringIdConfigCard'

// Strategy configuration stored per strategy
export interface StrategyConfig {
  enabled: boolean
  config: Record<string, unknown>
}

// Props value shape matching backend structure
export interface AccessStrategyValue {
  accessStrategyIds: string[]
  accessCombineMode: CombineMode
  accessStrategyConfigs: Record<string, StrategyConfig>
}

interface AccessStrategyConfigProps {
  value: AccessStrategyValue
  onChange: (value: AccessStrategyValue) => void
  disabled?: boolean
}

// Available strategies (can be extended)
const STRATEGIES = {
  public: {
    id: 'public',
    name: 'Public Access',
    description: 'Anyone can access this survey',
    icon: Globe,
  },
  whitelist: {
    id: 'whitelist',
    name: 'Whitelist',
    description: 'Require wallet address to be in whitelist',
    icon: Users,
  },
  bringid: {
    id: 'bringid',
    name: 'BringId Reputation',
    description: 'Verify identity and reputation via BringId',
    hasConfig: true,
  },
} as const

const DEFAULT_BRINGID_CONFIG: BringIdConfig = {
  minScore: 50,
  requireHumanityProof: false,
}

export function AccessStrategyConfig({
  value,
  onChange,
  disabled,
}: AccessStrategyConfigProps) {
  const { accessStrategyIds, accessCombineMode, accessStrategyConfigs } = value
  const [showPublicWarning, setShowPublicWarning] = useState(false)

  // Helper to check if strategy is enabled
  const isStrategyEnabled = (strategyId: string) =>
    accessStrategyIds.includes(strategyId)

  // Check if there are other strategies besides public
  const hasOtherStrategies = accessStrategyIds.some((id) => id !== 'public')

  // Confirm enabling public access - clears other strategies
  const confirmPublicAccess = () => {
    onChange({
      accessStrategyIds: ['public'],
      accessCombineMode,
      accessStrategyConfigs: {
        public: { enabled: true, config: {} },
      },
    })
    setShowPublicWarning(false)
  }

  // Toggle a simple strategy (public, whitelist)
  const toggleStrategy = (strategyId: string, enabled: boolean) => {
    // If enabling public and other strategies exist, show warning
    if (strategyId === 'public' && enabled && hasOtherStrategies) {
      setShowPublicWarning(true)
      return
    }

    let newIds: string[]
    let newConfigs = { ...accessStrategyConfigs }

    if (enabled) {
      newIds = [...accessStrategyIds, strategyId]
      newConfigs[strategyId] = {
        enabled: true,
        config: strategyId === 'bringid'
          ? (DEFAULT_BRINGID_CONFIG as unknown as Record<string, unknown>)
          : {},
      }
    } else {
      newIds = accessStrategyIds.filter((id) => id !== strategyId)
      delete newConfigs[strategyId]
    }

    onChange({
      accessStrategyIds: newIds,
      accessCombineMode,
      accessStrategyConfigs: newConfigs,
    })
  }

  // Update combine mode
  const handleCombineModeChange = (mode: CombineMode) => {
    onChange({
      ...value,
      accessCombineMode: mode,
    })
  }

  // Update BringId config
  const handleBringIdConfigChange = (config: BringIdConfig) => {
    onChange({
      ...value,
      accessStrategyConfigs: {
        ...accessStrategyConfigs,
        bringid: {
          enabled: true,
          config: config as unknown as Record<string, unknown>,
        },
      },
    })
  }

  // Get BringId config from value or use default
  const bringIdConfig: BringIdConfig = {
    ...DEFAULT_BRINGID_CONFIG,
    ...(accessStrategyConfigs.bringid?.config as Partial<BringIdConfig>),
  }

  const hasMultipleStrategies = accessStrategyIds.length > 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Control Settings</CardTitle>
        <CardDescription>
          Configure who can access this survey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Combine Mode - only show when multiple strategies selected */}
        {hasMultipleStrategies && (
          <>
            <CombineModeSelector
              value={accessCombineMode}
              onChange={handleCombineModeChange}
              disabled={disabled}
            />
            <Separator />
          </>
        )}

        {/* Strategy List */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Access Strategies</Label>

          {/* Public Access */}
          <Card className={!isStrategyEnabled('public') ? 'opacity-60' : undefined}>
            <CardHeader className="py-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="public-enabled"
                  checked={isStrategyEnabled('public')}
                  onCheckedChange={(checked) =>
                    toggleStrategy('public', checked === true)
                  }
                  disabled={disabled}
                />
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{STRATEGIES.public.name}</CardTitle>
                </div>
              </div>
              <CardDescription className="ml-7">
                {STRATEGIES.public.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Whitelist */}
          <Card className={!isStrategyEnabled('whitelist') ? 'opacity-60' : undefined}>
            <CardHeader className="py-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="whitelist-enabled"
                  checked={isStrategyEnabled('whitelist')}
                  onCheckedChange={(checked) =>
                    toggleStrategy('whitelist', checked === true)
                  }
                  disabled={disabled || isStrategyEnabled('public')}
                />
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{STRATEGIES.whitelist.name}</CardTitle>
                </div>
              </div>
              <CardDescription className="ml-7">
                {STRATEGIES.whitelist.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* BringId - has its own config card */}
          <BringIdConfigCard
            enabled={isStrategyEnabled('bringid')}
            onEnabledChange={(enabled) => toggleStrategy('bringid', enabled)}
            config={bringIdConfig}
            onConfigChange={handleBringIdConfigChange}
            disabled={disabled || isStrategyEnabled('public')}
          />
        </div>

        {/* Helper text */}
        {accessStrategyIds.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No access strategies selected. Survey will be accessible to everyone.
          </p>
        )}

        {/* Public Access Warning Dialog */}
        <AlertDialog open={showPublicWarning} onOpenChange={setShowPublicWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enable Public Access?</AlertDialogTitle>
              <AlertDialogDescription>
                Public access will make this survey available to everyone. Other access strategies (Whitelist, BringId) will be deactivated. The whitelist data will be preserved and can be reactivated later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmPublicAccess}>
                Enable Public Access
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// Re-export types for convenience
export type { CombineMode } from './CombineModeSelector'
export type { BringIdConfig } from './BringIdConfigCard'
