'use client'

import { SurveyForm as RefactoredSurveyForm } from '@/components/features/admin/SurveyForm'
import type {
  CreateSurveyRequest,
  UpdateSurveyRequest,
  AdminSurveyListItem,
} from '@/lib/types'

interface SurveyFormProps {
  survey?: AdminSurveyListItem
  onSubmit: (data: CreateSurveyRequest | UpdateSurveyRequest) => void
  isLoading?: boolean
  onCancel: () => void
}

export function SurveyForm({ survey, onSubmit, isLoading, onCancel }: SurveyFormProps) {
  return (
    <RefactoredSurveyForm 
      survey={survey}
      onSubmit={onSubmit}
      isLoading={isLoading}
      onCancel={onCancel}
    />
  )
}
