'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WinnersTable } from './WinnersTable'
import { AddWinnerForm } from './AddWinnerForm'
import { WinnersUpload } from './WinnersUpload'

interface WinnersModalProps {
  surveyId: string | null
  isOpen: boolean
  onClose: () => void
}

export function WinnersModal({ surveyId, isOpen, onClose }: WinnersModalProps) {
  const [activeTab, setActiveTab] = useState<string>('list')

  if (!surveyId) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Winners</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Winners List</TabsTrigger>
            <TabsTrigger value="add">Add Winner</TabsTrigger>
            <TabsTrigger value="upload">Upload JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <WinnersTable surveyId={surveyId} />
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <AddWinnerForm
              surveyId={surveyId}
              onSuccess={() => setActiveTab('list')}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <WinnersUpload
              surveyId={surveyId}
              onSuccess={() => setActiveTab('list')}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
