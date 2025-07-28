'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getWhitelistEntries,
  getWhitelistEntriesPaged,
  bulkAddWhitelistEntries,
  removeWhitelistEntry,
  clearWhitelist
} from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import { 
  Upload, 
  Trash2, 
  Users,
  AlertTriangle,
  X,
  FileText,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface WhitelistModalProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
  onClose: () => void
}

export function WhitelistModal({ survey, isOpen, onClose }: WhitelistModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replaceMode, setReplaceMode] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [activeTab, setActiveTab] = useState('import')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const notifications = useNotifications()
  const queryClient = useQueryClient()
  
  // Debounce search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  const ITEMS_PER_PAGE = 20

  // Get current whitelist count for display (used by Clear All button)
  const { data: whitelistData } = useQuery({
    queryKey: ['whitelist-simple', survey?.id],
    queryFn: () => survey ? getWhitelistEntries(survey.id) : Promise.resolve(null),
    enabled: !!survey && isOpen,
    retry: false, // Don't retry on error
    refetchOnWindowFocus: false
  })
  
  // Get paginated whitelist with search for addresses tab
  const { data: pagedData, isLoading: isPagedLoading, error: pagedError } = useQuery({
    queryKey: ['whitelist-paged', survey?.id, debouncedSearchTerm, currentPage],
    queryFn: () => survey ? getWhitelistEntriesPaged(survey.id, {
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
      search: debouncedSearchTerm || undefined
    }) : Promise.resolve(null),
    enabled: !!survey && isOpen && activeTab === 'addresses'
  })

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setReplaceMode(false)
      setIsImporting(false)
      setActiveTab('import')
      setSearchTerm('')
      setCurrentPage(0)
    }
  }, [isOpen])
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedSearchTerm])

  // Import whitelist mutation
  const importWhitelistMutation = useMutation({
    mutationFn: async ({ addresses, replaceMode }: { addresses: string[], replaceMode: boolean }) => {
      if (!survey) throw new Error('No survey selected')
      
      return await bulkAddWhitelistEntries({
        surveyId: survey.id,
        walletAddresses: addresses,
        replaceMode
      })
    },
    onSuccess: (data) => {
      const { addedCount, skippedCount, mode } = data
      const action = mode === 'replaced' ? 'replaced' : 'imported'
      
      notifications.success(
        'Import Complete',
        `Successfully ${action} ${addedCount} addresses${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`
      )
      
      setIsImporting(false)
      setSelectedFile(null)
      // Invalidate all whitelist queries
      queryClient.invalidateQueries({ queryKey: ['whitelist-simple'] })
      queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to import addresses'
      notifications.error('Import Failed', errorMessage)
      setIsImporting(false)
    }
  })

  // Clear whitelist mutation
  const clearWhitelistMutation = useMutation({
    mutationFn: async () => {
      if (!survey) throw new Error('No survey selected')
      await clearWhitelist(survey.id)
    },
    onSuccess: () => {
      notifications.success('Whitelist cleared', 'All addresses have been removed from whitelist')
      queryClient.invalidateQueries({ queryKey: ['whitelist-simple'] })
      queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to clear whitelist'
      notifications.error('Clear Failed', errorMessage)
    }
  })
  
  // Remove single address mutation
  const removeAddressMutation = useMutation({
    mutationFn: ({ surveyId, address }: { surveyId: string, address: string }) =>
      removeWhitelistEntry(surveyId, address),
    onSuccess: () => {
      notifications.success('Address removed', 'Address has been removed from whitelist')
      queryClient.invalidateQueries({ queryKey: ['whitelist-simple'] })
      queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to remove address'
      notifications.error('Remove Failed', errorMessage)
    }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.txt')) {
        notifications.error('Invalid file type', 'Please select a TXT file')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !survey) return
    
    setIsImporting(true)
    
    try {
      const text = await selectedFile.text()
      const addresses = text
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0)
      
      if (addresses.length === 0) {
        notifications.error('Empty file', 'No addresses found in the selected file')
        setIsImporting(false)
        return
      }
      
      // Basic validation for wallet addresses
      const invalidAddresses = addresses.filter(addr => 
        !addr.match(/^0x[a-fA-F0-9]{40}$/i)
      )
      
      if (invalidAddresses.length > 0) {
        notifications.error(
          'Invalid addresses found',
          `Found ${invalidAddresses.length} invalid address(es). Please check the file format.`
        )
        setIsImporting(false)
        return
      }
      
      // Process the import
      await importWhitelistMutation.mutateAsync({ addresses, replaceMode })
    } catch (error) {
      notifications.error('File read error', 'Failed to read the selected file')
      setIsImporting(false)
    }
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all addresses from this whitelist?')) {
      clearWhitelistMutation.mutate()
    }
  }

  const handleClose = () => {
    if (isImporting) {
      if (window.confirm('Import is in progress. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }
  
  const handleRemoveAddress = (address: string) => {
    if (!survey) return
    if (confirm(`Are you sure you want to remove address ${address} from the whitelist?`)) {
      removeAddressMutation.mutate({ surveyId: survey.id, address })
    }
  }
  
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  if (!survey) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Whitelist Management - {survey.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import Addresses</TabsTrigger>
              <TabsTrigger value="addresses">View Addresses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="import" className="flex-1 space-y-6 mt-6">
              {/* File Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Import from TXT file (one address per line)
                  </label>
                  
                  {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Select a TXT file to import wallet addresses</p>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isImporting}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                          <span className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          disabled={isImporting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".txt"
                    className="hidden"
                  />
                </div>

                {/* Replace/Append Mode Toggle */}
                {selectedFile && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Switch
                      id="replace-mode"
                      checked={replaceMode}
                      onCheckedChange={setReplaceMode}
                      disabled={isImporting}
                    />
                    <div className="flex-1">
                      <Label htmlFor="replace-mode" className="text-sm font-medium">
                        {replaceMode ? 'Replace existing whitelist' : 'Add to existing whitelist'}
                      </Label>
                      <p className="text-xs text-gray-600">
                        {replaceMode 
                          ? 'All current addresses will be removed and replaced with imported ones'
                          : 'New addresses will be added to the existing whitelist (duplicates will be skipped)'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="addresses" className="flex-1 space-y-4 mt-6">
              {/* Search Bar */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search addresses..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {pagedData ? `${pagedData.pagination.filtered} of ${pagedData.pagination.total} addresses` : ''}
                </div>
              </div>
              
              {/* Addresses Table */}
              {isPagedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : pagedError ? (
                <div className="flex items-center justify-center py-8 text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Failed to load addresses
                </div>
              ) : !pagedData?.addresses.length ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No addresses match your search criteria.' : 'This survey has no whitelist entries yet.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Completed At</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedData.addresses.map((entry) => (
                          <TableRow key={entry.address}>
                            <TableCell className="font-mono text-sm">
                              {entry.address}
                            </TableCell>
                            <TableCell>
                              {entry.hasCompleted ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {entry.completedAt 
                                ? new Date(entry.completedAt).toLocaleDateString()
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAddress(entry.address)}
                                disabled={removeAddressMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {pagedData.pagination.total > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing {currentPage * ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * ITEMS_PER_PAGE, pagedData.pagination.filtered)} of {pagedData.pagination.filtered} addresses
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage + 1} of {Math.ceil(pagedData.pagination.filtered / ITEMS_PER_PAGE)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagedData.pagination.hasMore}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between pt-4 border-t">
          {activeTab === 'import' ? (
            <>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={clearWhitelistMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isImporting ? 'Importing...' : 'Import Addresses'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={clearWhitelistMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}