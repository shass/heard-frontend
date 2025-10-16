'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useOpenUrl } from '@/src/platforms/base-app/hooks/useOpenUrl'
import { toast } from 'sonner'
import { 
  useSurveyClients, 
  useAddSurveyClient, 
  useUpdateSurveyClient, 
  useRemoveSurveyClient,
  useSurveyVisibility,
  useUpdateSurveyVisibility,
  useGenerateShareLink
} from '@/hooks/use-survey-clients'

// Schemas
const walletAddressSchema = z
  .string()
  .min(1, 'Wallet address is required')

const addClientSchema = z.object({
  walletAddress: walletAddressSchema,
  canMakePublic: z.boolean().default(true),
})

export type AddClientForm = z.infer<typeof addClientSchema>
export type ActiveTab = 'clients' | 'visibility'

interface UseSurveyClientsModalProps {
  surveyId: string | null
}

export function useSurveyClientsModal({ surveyId }: UseSurveyClientsModalProps) {
  const openUrl = useOpenUrl()
  const [activeTab, setActiveTab] = useState<ActiveTab>('clients')
  
  // API hooks
  const { data: clients, isLoading: clientsLoading } = useSurveyClients(surveyId || '')
  const { data: visibility, isLoading: visibilityLoading } = useSurveyVisibility(surveyId || '')
  
  const addClient = useAddSurveyClient()
  const updateClient = useUpdateSurveyClient()
  const removeClient = useRemoveSurveyClient()
  const updateVisibility = useUpdateSurveyVisibility()
  const generateLink = useGenerateShareLink()

  // Form setup
  const form = useForm<AddClientForm>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      walletAddress: '',
      canMakePublic: true,
    }
  })

  // Handlers
  const handleAddClient = async (data: AddClientForm) => {
    if (!surveyId) return
    
    try {
      await addClient.mutateAsync({
        surveyId,
        request: data
      })
      form.reset()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleUpdateClientPermission = async (walletAddress: string, canMakePublic: boolean) => {
    if (!surveyId) return
    
    try {
      await updateClient.mutateAsync({
        surveyId,
        walletAddress,
        request: { canMakePublic }
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleRemoveClient = async (walletAddress: string) => {
    if (!surveyId) return
    
    if (!confirm('Remove this client from the survey? They will lose access to results.')) {
      return
    }
    
    try {
      await removeClient.mutateAsync({
        surveyId,
        walletAddress
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleVisibilityChange = async (mode: 'private' | 'public' | 'link') => {
    if (!surveyId) return
    
    try {
      await updateVisibility.mutateAsync({
        surveyId,
        request: { visibilityMode: mode }
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleGenerateLink = async () => {
    if (!surveyId) return
    
    try {
      await generateLink.mutateAsync(surveyId)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    }
  }

  const openResults = () => {
    if (!surveyId) return
    const url = `/surveys/${surveyId}/results`
    openUrl(url)
  }

  const getResultsUrl = () => {
    if (!surveyId) return ''
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/surveys/${surveyId}/results`
    }
    return `/surveys/${surveyId}/results`
  }

  return {
    // State
    activeTab,
    setActiveTab,
    
    // Data
    clients,
    visibility,
    clientsLoading,
    visibilityLoading,
    
    // Form
    form,
    
    // Mutations
    addClient,
    updateClient,
    removeClient,
    updateVisibility,
    generateLink,
    
    // Handlers
    handleAddClient,
    handleUpdateClientPermission,
    handleRemoveClient,
    handleVisibilityChange,
    handleGenerateLink,
    copyToClipboard,
    openResults,
    getResultsUrl,
  }
}