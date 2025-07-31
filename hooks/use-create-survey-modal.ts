'use client'

import { createContext, useContext } from 'react'

interface CreateSurveyModalContextType {
  showCreateModal: boolean
  openModal: () => void
  closeModal: () => void
}

const CreateSurveyModalContext = createContext<CreateSurveyModalContextType | null>(null)

export function useCreateSurveyModal() {
  const context = useContext(CreateSurveyModalContext)
  if (!context) {
    throw new Error('useCreateSurveyModal must be used within CreateSurveyModalProvider')
  }
  return context
}

// Export context for provider
export { CreateSurveyModalContext }