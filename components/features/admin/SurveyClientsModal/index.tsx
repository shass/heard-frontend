'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Eye,
} from 'lucide-react'
import { useSurveyClientsModal } from './hooks/useSurveyClientsModal'
import { ClientsTab } from './ClientsTab'
import { VisibilityTab } from './VisibilityTab'

interface SurveyClientsModalProps {
  survey: { id: string; name: string; company?: string } | null
  isOpen: boolean
  onClose: () => void
}

export function SurveyClientsModal({ survey, isOpen, onClose }: SurveyClientsModalProps) {
  const {
    activeTab,
    setActiveTab,
    clients,
    visibility,
    clientsLoading,
    visibilityLoading,
    form,
    addClient,
    updateClient,
    removeClient,
    updateVisibility,
    generateLink,
    handleAddClient,
    handleUpdateClientPermission,
    handleRemoveClient,
    handleVisibilityChange,
    handleGenerateLink,
    copyToClipboard,
    openResults,
    getResultsUrl,
  } = useSurveyClientsModal({ surveyId: survey?.id || null })

  if (!survey) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Survey Client Management
          </DialogTitle>
          <DialogDescription>
            Manage clients and visibility settings for "{survey.name}"
            {survey.company && ` by ${survey.company}`}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'clients'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('clients')}
          >
            <Users className="h-4 w-4 mr-2 inline" />
            Survey Clients ({clients?.length || 0})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'visibility'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('visibility')}
          >
            <Eye className="h-4 w-4 mr-2 inline" />
            Visibility Settings
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'clients' ? (
            <ClientsTab
              clients={clients}
              clientsLoading={clientsLoading}
              form={form}
              addClient={addClient}
              updateClient={updateClient}
              removeClient={removeClient}
              handleAddClient={handleAddClient}
              handleUpdateClientPermission={handleUpdateClientPermission}
              handleRemoveClient={handleRemoveClient}
            />
          ) : (
            <VisibilityTab
              visibility={visibility}
              visibilityLoading={visibilityLoading}
              generateLink={generateLink}
              handleVisibilityChange={handleVisibilityChange}
              handleGenerateLink={handleGenerateLink}
              copyToClipboard={copyToClipboard}
              openResults={openResults}
              getResultsUrl={getResultsUrl}
            />
          )}
        </div>

        <Separator />
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}