'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getRewardLinks, 
  deleteRewardLink, 
  clearAllRewardLinks, 
  importRewardLinks 
} from '@/lib/api/admin'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import { 
  Trash2, 
  Upload, 
  ExternalLink, 
  Copy, 
  User, 
  Calendar,
  AlertTriangle,
  File
} from 'lucide-react'
import type { AdminSurveyListItem, RewardLinksData } from '@/lib/types'

interface RewardLinksModalProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
  onClose: () => void
}

export function RewardLinksModal({ survey, isOpen, onClose }: RewardLinksModalProps) {
  const [txtData, setTxtData] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('unused')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notifications = useNotifications()
  const queryClient = useQueryClient()

  // Fetch reward links data
  const { data: rewardData, isLoading, error } = useQuery({
    queryKey: ['admin-reward-links', survey?.id],
    queryFn: () => survey ? getRewardLinks(survey.id) : Promise.resolve(null),
    enabled: !!survey && isOpen,
    refetchInterval: 30000
  })

  // Remove single link addition mutation - no longer needed

  // Delete reward link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (rewardId: string) => 
      survey ? deleteRewardLink(survey.id, rewardId) : Promise.reject('No survey'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reward-links', survey?.id] })
      notifications.success('Reward Link Deleted', 'Reward link has been deleted successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to delete reward link'
      notifications.error('Delete Failed', errorMessage)
    }
  })

  // Clear all reward links mutation
  const clearAllMutation = useMutation({
    mutationFn: () => 
      survey ? clearAllRewardLinks(survey.id) : Promise.reject('No survey'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reward-links', survey?.id] })
      notifications.success('All Links Cleared', 'All reward links have been cleared successfully')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to clear reward links'
      notifications.error('Clear Failed', errorMessage)
    }
  })

  // Import TXT mutation
  const importTxtMutation = useMutation({
    mutationFn: (txtData: string) => 
      survey ? importRewardLinks(survey.id, { txtData }) : Promise.reject('No survey'),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reward-links', survey?.id] })
      setTxtData('')
      
      // Show detailed import results
      if (result.imported === 0) {
        notifications.error('Import Failed', result.message)
      } else if (result.skipped === 0) {
        notifications.success('Import Complete', result.message)
      } else {
        notifications.success(
          'Import Partially Complete',
          `${result.message}${result.failedLinks.length > 0 ? ` (${result.failedLinks.length} failed links)` : ''}`
        )
      }
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to import reward links'
      notifications.error('Import Failed', errorMessage)
    }
  })

  // Remove single link handler - no longer needed

  const handleDeleteLink = (rewardId: string) => {
    if (confirm('Are you sure you want to delete this reward link?')) {
      deleteLinkMutation.mutate(rewardId)
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL reward links? This action cannot be undone.')) {
      clearAllMutation.mutate()
    }
  }

  const handleImportFile = () => {
    if (!txtData.trim()) {
      notifications.error('Validation Error', 'Please select a file to import')
      return
    }

    // Basic validation - check if it looks like text format (one link per line)
    const lines = txtData.trim().split('\n')
    const validLines = lines.filter(line => line.trim().length > 0)
    
    if (validLines.length === 0) {
      notifications.error('Validation Error', 'No valid links found in selected file')
      return
    }

    importTxtMutation.mutate(txtData.trim())
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.txt')) {
      notifications.error('Invalid File Type', 'Please select a .txt file')
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setTxtData(content)
        notifications.success('File Loaded', `Loaded ${content.split('\n').filter(line => line.trim()).length} links from ${file.name}`)
      }
    }
    reader.onerror = () => {
      notifications.error('File Error', 'Failed to read file')
      setSelectedFile(null)
      setTxtData('')
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setTxtData('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    notifications.success('Copied', 'Link copied to clipboard')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{rewardData.stats.total}</div>
                  <div className="text-sm text-blue-600">Total Links</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{rewardData.stats.unused}</div>
                  <div className="text-sm text-green-600">Available</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{rewardData.stats.used}</div>
                  <div className="text-sm text-gray-600">Used</div>
                </div>
              </div>

              {/* Tabs */}
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
                  <div className="h-full overflow-y-auto space-y-2">
                    {rewardData.unused.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No available reward links</p>
                        <p className="text-sm">Add some links in the Manage tab</p>
                      </div>
                    ) : (
                      rewardData.unused.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-green-600" />
                              <span className="font-mono text-sm truncate max-w-md">
                                {link.claimLink}
                              </span>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Available
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              Added {formatDate(link.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(link.claimLink)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLink(link.id)}
                              disabled={deleteLinkMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="used" className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto space-y-2">
                    {rewardData.used.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No used reward links</p>
                        <p className="text-sm">Links used by users will appear here</p>
                      </div>
                    ) : (
                      rewardData.used.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-gray-600" />
                              <span className="font-mono text-sm truncate max-w-md">
                                {link.claimLink}
                              </span>
                              <Badge variant="secondary">Used</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="font-mono">{link.usedBy}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Used {formatDate(link.usedAt)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link.claimLink)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="manage" className="flex-1 overflow-hidden">
                  <div className="space-y-6">
                    {/* Import from File */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Import Reward Links</h4>
                        <p className="text-sm text-gray-600 mt-1">Upload a .txt file with one reward link per line</p>
                      </div>
                      
                      {/* File selection */}
                      {!selectedFile ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-sm text-gray-600 mb-4">Select a .txt file to import reward links</p>
                          <Button 
                            onClick={handleFileSelect}
                            variant="outline"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <File className="w-8 h-8 text-blue-500" />
                              <div>
                                <p className="font-medium text-sm">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">
                                  {txtData.trim() ? `${txtData.trim().split('\n').filter(line => line.trim()).length} links` : '0 links'} • {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button 
                              onClick={handleRemoveFile}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button 
                              onClick={handleImportFile}
                              disabled={importTxtMutation.isPending || !txtData.trim()}
                              className="min-w-[120px]"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {importTxtMutation.isPending ? 'Importing...' : 'Import Links'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-3 pt-6 border-t">
                      <h4 className="font-medium text-red-600">Danger Zone</h4>
                      <Button 
                        onClick={handleClearAll}
                        disabled={clearAllMutation.isPending}
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Reward Links
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}