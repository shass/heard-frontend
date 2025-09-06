'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  Search,
} from 'lucide-react'
import { useRewardLinksModal } from './hooks/useRewardLinksModal'
import { StatsSection } from './StatsSection'
import { UnusedLinksTab } from './UnusedLinksTab'
import { UsedLinksTab } from './UsedLinksTab'
import { ManageTab } from './ManageTab'
import type { AdminSurveyListItem } from '@/lib/types'

interface RewardLinksModalPaginatedProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
  onClose: () => void
}

export function RewardLinksModalPaginated({ survey, isOpen, onClose }: RewardLinksModalPaginatedProps) {
  const {
    txtData,
    selectedFile,
    activeTab,
    setActiveTab,
    pagination,
    fileInputRef,
    rewardData,
    isLoading,
    error,
    deleteLinkMutation,
    clearAllMutation,
    importTxtMutation,
    handleDeleteLink,
    handleClearAll,
    handleImportFile,
    handleFileSelect,
    handleFileUpload,
    handleRemoveFile,
    copyToClipboard,
    handleSearch,
    handlePageChange,
  } = useRewardLinksModal({ survey, isOpen })

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
          <div className="space-y-4 h-full flex flex-col">
            {/* Stats */}
            <StatsSection stats={rewardData?.stats} />

            {/* Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as typeof activeTab)} 
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="unused" className="flex items-center gap-2">
                  Available ({rewardData?.stats?.unused || 0})
                </TabsTrigger>
                <TabsTrigger value="used" className="flex items-center gap-2">
                  Used ({rewardData?.stats?.used || 0})
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  Manage
                </TabsTrigger>
              </TabsList>

              {/* Search bar for unused/used tabs */}
              {(activeTab === 'unused' || activeTab === 'used') && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={`Search ${activeTab} reward links...`}
                    value={pagination.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              <TabsContent value="unused" className="flex-1 overflow-hidden flex flex-col">
                <UnusedLinksTab
                  isLoading={isLoading}
                  error={error}
                  rewardData={rewardData}
                  search={pagination.search}
                  handleDeleteLink={handleDeleteLink}
                  deleteLinkMutation={deleteLinkMutation}
                  copyToClipboard={copyToClipboard}
                  onPageChange={handlePageChange}
                />
              </TabsContent>

              <TabsContent value="used" className="flex-1 overflow-hidden flex flex-col">
                <UsedLinksTab
                  isLoading={isLoading}
                  error={error}
                  rewardData={rewardData}
                  search={pagination.search}
                  copyToClipboard={copyToClipboard}
                  onPageChange={handlePageChange}
                />
              </TabsContent>

              <TabsContent value="manage" className="flex-1 overflow-hidden">
                <ManageTab
                  selectedFile={selectedFile}
                  txtData={txtData}
                  fileInputRef={fileInputRef}
                  importTxtMutation={importTxtMutation}
                  clearAllMutation={clearAllMutation}
                  handleFileSelect={handleFileSelect}
                  handleFileUpload={handleFileUpload}
                  handleRemoveFile={handleRemoveFile}
                  handleImportFile={handleImportFile}
                  handleClearAll={handleClearAll}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}