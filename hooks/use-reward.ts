import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface LinkdropReward {
  type: 'linkdrop' | 'linkdrop_code' | 'completed_no_reward'
  claimLink?: string
  linkDropCode?: string
  usedAt?: string
  heardPointsAwarded: number
  survey: {
    name: string
    rewardAmount: number
    rewardToken: string
  }
  message?: string
}

export function useUserReward(surveyId: string) {
  return useQuery<LinkdropReward>({
    queryKey: ['user-reward', surveyId],
    queryFn: async () => {
      return await apiClient.get<LinkdropReward>(`/surveys/${surveyId}/my-reward`)
    },
    enabled: !!surveyId,
    retry: (failureCount, error: any) => {
      // Don't retry if survey not completed or no reward available
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 3
    }
  })
}
