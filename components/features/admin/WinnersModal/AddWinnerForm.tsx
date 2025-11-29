'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAddWinners } from '@/hooks'

const winnerSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  rewardLink: z.string().url('Invalid URL'),
  place: z.string().optional(),
  rewardType: z.string().optional(),
})

type WinnerFormData = z.infer<typeof winnerSchema>

interface AddWinnerFormProps {
  surveyId: string
  onSuccess: () => void
}

export function AddWinnerForm({ surveyId, onSuccess }: AddWinnerFormProps) {
  const addWinners = useAddWinners()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<WinnerFormData>({
    resolver: zodResolver(winnerSchema),
    defaultValues: {
      walletAddress: '',
      rewardLink: '',
      place: '',
      rewardType: '',
    }
  })

  const onSubmit = async (data: WinnerFormData) => {
    // Convert place to number if provided
    const winner = {
      walletAddress: data.walletAddress,
      rewardLink: data.rewardLink,
      ...(data.place ? { place: parseInt(data.place) } : {}),
      ...(data.rewardType ? { rewardType: data.rewardType } : {}),
    }

    addWinners.mutate(
      { surveyId, request: { winners: [winner] } },
      {
        onSuccess: () => {
          reset()
          onSuccess()
        }
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Winner</CardTitle>
        <CardDescription>
          Add a single winner to this survey. Each wallet can only have one reward per survey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="walletAddress">Wallet Address *</Label>
            <Input
              id="walletAddress"
              {...register('walletAddress')}
              placeholder="0x..."
            />
            {errors.walletAddress && (
              <p className="text-sm text-red-600 mt-1">{errors.walletAddress.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rewardLink">Reward Link *</Label>
            <Input
              id="rewardLink"
              type="url"
              {...register('rewardLink')}
              placeholder="https://..."
            />
            {errors.rewardLink && (
              <p className="text-sm text-red-600 mt-1">{errors.rewardLink.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="place">Place (Optional)</Label>
              <Input
                id="place"
                type="number"
                {...register('place')}
                placeholder="1"
              />
              {errors.place && (
                <p className="text-sm text-red-600 mt-1">{errors.place.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="rewardType">Reward Type (Optional)</Label>
              <Input
                id="rewardType"
                {...register('rewardType')}
                placeholder="Grand Prize"
              />
              {errors.rewardType && (
                <p className="text-sm text-red-600 mt-1">{errors.rewardType.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Winner'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
