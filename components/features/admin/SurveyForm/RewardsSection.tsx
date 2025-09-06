'use client'

import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { SurveyFormData } from './hooks/useSurveyForm'

interface RewardsSectionProps {
  register: UseFormRegister<SurveyFormData>
  errors: FieldErrors<SurveyFormData>
}

export function RewardsSection({ register, errors }: RewardsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="rewardAmount">Reward Amount *</Label>
            <Input
              id="rewardAmount"
              type="number"
              step="0.001"
              {...register('rewardAmount', { valueAsNumber: true })}
              placeholder="0.01"
            />
            {errors.rewardAmount && (
              <p className="text-sm text-red-600 mt-1">{errors.rewardAmount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rewardToken">Reward Token *</Label>
            <Input
              id="rewardToken"
              placeholder="e.g. ETH, USDC, TokenName"
              {...register('rewardToken')}
            />
            {errors.rewardToken && (
              <p className="text-sm text-red-600 mt-1">{errors.rewardToken.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="heardPointsReward">HeardPoints Reward *</Label>
            <Input
              id="heardPointsReward"
              type="number"
              {...register('heardPointsReward', { valueAsNumber: true })}
              placeholder="100"
            />
            {errors.heardPointsReward && (
              <p className="text-sm text-red-600 mt-1">{errors.heardPointsReward.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}