'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getWhitelistEntriesPaged,
  removeWhitelistEntry,
  clearWhitelist
} from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import { WhitelistUpload } from './whitelist-upload'
import { 
  Users,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  Trash2
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
  const [activeTab, setActiveTab] = useState('upload')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  
  const notifications = useNotifications()
  const queryClient = useQueryClient()
  
  // Debounce search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  const ITEMS_PER_PAGE = 20

  // Get paginated whitelist with search for addresses tab
  const { data: pagedData, isLoading: isPagedLoading, error: pagedError } = useQuery({
    queryKey: ['whitelist-paged', survey?.id, debouncedSearchTerm, currentPage],
    queryFn: () => survey ? getWhitelistEntriesPaged(survey.id, {
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
      search: debouncedSearchTerm || undefined
    }) : Promise.resolve(null),
    enabled: !!survey && isOpen && activeTab === 'manage'
  })

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('upload')
      setSearchTerm('')
      setCurrentPage(0)
    }
  }, [isOpen])
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedSearchTerm])

  // Clear whitelist mutation
  const clearWhitelistMutation = useMutation({
    mutationFn: async () => {
      if (!survey) throw new Error('No survey selected')
      await clearWhitelist(survey.id)
    },
    onSuccess: () => {
      notifications.success('Whitelist cleared', 'All addresses have been removed from whitelist')
      queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
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
      queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to remove address'
      notifications.error('Remove Failed', errorMessage)
    }
  })

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all addresses from this whitelist?')) {
      clearWhitelistMutation.mutate()
    }
  }

  const handleClose = () => {
    onClose()
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

  const handleUploadSuccess = () => {
    // Refresh data and switch to manage tab
    queryClient.invalidateQueries({ queryKey: ['whitelist-paged'] })
    queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    setActiveTab('manage')
    notifications.success('Upload Complete', 'Successfully imported addresses')
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
            
            <TabsContent value="manage" className="flex-1 space-y-4 mt-6">
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
                  {!searchTerm && (
                    <Button 
                      onClick={() => setActiveTab('upload')} 
                      className="mt-4"
                      variant="outline"
                    >
                      Upload Addresses
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
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