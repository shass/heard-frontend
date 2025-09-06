'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WhitelistUpload } from '@/components/admin/whitelist-upload'
import { Users, Trash2 } from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'
import { useWhitelistModal } from './hooks/useWhitelistModal'
import { ManageTab } from './ManageTab'

interface WhitelistModalProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
  onClose: () => void
}

export function WhitelistModal({ survey, isOpen, onClose }: WhitelistModalProps) {
  const {
    // State
    activeTab,
    setActiveTab,
    searchTerm,
    currentPage,
    ITEMS_PER_PAGE,
    
    // Data
    pagedData,
    isPagedLoading,
    pagedError,
    
    // Mutations
    clearWhitelistMutation,
    removeAddressMutation,
    
    // Handlers
    handleClear,
    handleRemoveAddress,
    handleSearchChange,
    handlePageChange,
    handleUploadSuccess
  } = useWhitelistModal({ survey, isOpen })

  const handleClose = () => {
    onClose()
  }

  if (!survey) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Whitelist Management - {survey.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Addresses</TabsTrigger>
              <TabsTrigger value="manage">Manage Addresses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="flex-1 space-y-6 mt-6">
              <WhitelistUpload 
                survey={survey}
                onSuccess={handleUploadSuccess}
                onCancel={() => setActiveTab('manage')}
              />
            </TabsContent>
            
            <TabsContent value="manage">
              <ManageTab
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                pagedData={pagedData}
                isLoading={isPagedLoading}
                error={pagedError}
                onRemoveAddress={handleRemoveAddress}
                isRemoving={removeAddressMutation.isPending}
                currentPage={currentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                onUploadClick={() => setActiveTab('upload')}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={clearWhitelistMutation.isPending}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>

          <Button
            variant="outline"
            onClick={handleClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}