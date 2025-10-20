import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface LinkdropReward {
  type: 'linkdrop' | 'completed_no_reward'
  claimLink?: string
  usedAt?: string
  heardPointsAwarded: number
  survey: {
    name: string
    rewardAmount: number
    rewardToken: string
  }
  message?: string
}

export function useUserReward(surveyId: string, isConnected?: boolean) {
  return useQuery<LinkdropReward>({
    queryKey: ['user-reward', surveyId],
    queryFn: async () => {
      return await apiClient.get<LinkdropReward>(`/surveys/${surveyId}/my-reward`)
    },
    enabled: !!surveyId && (isConnected !== false),
    retry: (failureCount, error: any) => {
      // Don't retry if survey not completed or no reward available
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    }
  })
}
