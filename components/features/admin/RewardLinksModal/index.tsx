'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/loading-states'
import { ExternalLink, AlertTriangle } from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'
import { useRewardLinksModal } from './hooks/useRewardLinksModal'
import { StatsSection } from './StatsSection'
import { UnusedLinksTab } from './UnusedLinksTab'
import { UsedLinksTab } from './UsedLinksTab'
import { ManageTab } from './ManageTab'

interface RewardLinksModalProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
  onClose: () => void
}

export function RewardLinksModal({ survey, isOpen, onClose }: RewardLinksModalProps) {
  const {
    txtData,
    selectedFile,
    activeTab,
    setActiveTab,
    fileInputRef,
    rewardData,
    isLoading,
    error,
    handleDeleteLink,
    handleClearAll,
    handleImportFile,
    handleFileSelect,
    handleFileUpload,
    handleRemoveFile,
    copyToClipboard,
    formatDate,
    deleteLinkMutation,
    clearAllMutation,
    importTxtMutation
  } = useRewardLinksModal(survey, isOpen)

  if (!survey) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Reward Links Management
            <Badge variant="outline">{survey.name}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-600">
              <AlertTriangle className="w-8 h-8 mr-2" />
              Failed to load reward links
            </div>
          ) : rewardData ? (
            <div className="space-y-4 h-full flex flex-col">
              <StatsSection rewardData={rewardData} />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="unused" className="flex items-center gap-2">
                    Available ({rewardData.stats.unused})
                  </TabsTrigger>
                  <TabsTrigger value="used" className="flex items-center gap-2">
                    Used ({rewardData.stats.used})
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="flex items-center gap-2">
                    Manage
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unused" className="flex-1 overflow-hidden">
                  <UnusedLinksTab
                    rewardData={rewardData}
                    onDeleteLink={handleDeleteLink}
                    onCopyToClipboard={copyToClipboard}
                    formatDate={formatDate}
                    deleteLinkMutation={deleteLinkMutation}
                  />
                </TabsContent>

                <TabsContent value="used" className="flex-1 overflow-hidden">
                  <UsedLinksTab
                    rewardData={rewardData}
                    onCopyToClipboard={copyToClipboard}
                    formatDate={formatDate}
                  />
                </TabsContent>

                <TabsContent value="manage" className="flex-1 overflow-hidden">
                  <ManageTab
                    selectedFile={selectedFile}
                    txtData={txtData}
                    fileInputRef={fileInputRef}
                    onFileSelect={handleFileSelect}
                    onFileUpload={handleFileUpload}
                    onRemoveFile={handleRemoveFile}
                    onImportFile={handleImportFile}
                    onClearAll={handleClearAll}
                    importTxtMutation={importTxtMutation}
                    clearAllMutation={clearAllMutation}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}