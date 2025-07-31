'use client'

import { useState } from 'react'
import { CreateSurveyModalContext } from '@/hooks/use-create-survey-modal'
import { CreateSurveyModal } from '@/components/ui/create-survey-modal'

interface CreateSurveyModalProviderProps {
  children: React.ReactNode
}

export function CreateSurveyModalProvider({ children }: CreateSurveyModalProviderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const openModal = () => setShowCreateModal(true)
  const closeModal = () => setShowCreateModal(false)

  return (
    <CreateSurveyModalContext.Provider value={{ showCreateModal, openModal, closeModal }}>
      {children}
      <CreateSurveyModal
        isOpen={showCreateModal}
        onClose={closeModal}
      />
    </CreateSurveyModalContext.Provider>
  )
}