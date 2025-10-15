'use client'

import { useState, useCallback, useMemo } from 'react'
import { CreateSurveyModalContext } from '@/hooks/use-create-survey-modal'
import { CreateSurveyModal } from '@/components/ui/create-survey-modal'

interface CreateSurveyModalProviderProps {
  children: React.ReactNode
}

export function CreateSurveyModalProvider({ children }: CreateSurveyModalProviderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const openModal = useCallback(() => setShowCreateModal(true), [])
  const closeModal = useCallback(() => setShowCreateModal(false), [])

  const contextValue = useMemo(
    () => ({ showCreateModal, openModal, closeModal }),
    [showCreateModal, openModal, closeModal]
  )

  return (
    <CreateSurveyModalContext.Provider value={contextValue}>
      {children}
      <CreateSurveyModal
        isOpen={showCreateModal}
        onClose={closeModal}
      />
    </CreateSurveyModalContext.Provider>
  )
}