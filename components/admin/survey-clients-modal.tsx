'use client'

import { SurveyClientsModal as RefactoredSurveyClientsModal } from '@/components/features/admin/SurveyClientsModal'

interface SurveyClientsModalProps {
  survey: { id: string; name: string; company?: string } | null
  isOpen: boolean
  onClose: () => void
}

export function SurveyClientsModal({ survey, isOpen, onClose }: SurveyClientsModalProps) {
  return (
    <RefactoredSurveyClientsModal 
      survey={survey}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}