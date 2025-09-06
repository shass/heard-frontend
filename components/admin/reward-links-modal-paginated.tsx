'use client'

import { RewardLinksModalPaginated as RefactoredRewardLinksModalPaginated } from '@/components/features/admin/RewardLinksModalPaginated'
import type { AdminSurveyListItem } from '@/lib/types'

interface RewardLinksModalPaginatedProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
  onClose: () => void
}

export function RewardLinksModalPaginated({ survey, isOpen, onClose }: RewardLinksModalPaginatedProps) {
  return (
    <RefactoredRewardLinksModalPaginated 
      survey={survey}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}