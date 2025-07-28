'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getAdminSurveys,
  getWhitelistEntries,
  addWhitelistEntry,
  bulkAddWhitelistEntries,
  removeWhitelistEntry,
  toggleWhitelistEntry,
  clearWhitelist,
  importWhitelistFromCSV
} from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import { 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Search,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react'
import type { WhitelistEntry, AdminSurveyListItem } from '@/lib/types'

export function WhitelistManagement() {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [bulkAddresses, setBulkAddresses] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const notifications = useNotifications()
  const queryClient = useQueryClient()

  // Get all surveys for dropdown
  const { data: surveysData } = useQuery({
    queryKey: ['admin-surveys-list'],
    queryFn: () => getAdminSurveys({ limit: 100 })
  })

  // Get whitelist entries for selected survey
  const { data: whitelistData, isLoading, error } = useQuery({
    queryKey: ['whitelist-entries', selectedSurveyId, searchTerm],
    queryFn: () => getWhitelistEntries(selectedSurveyId, { 
      search: searchTerm || undefined,
      limit: 100 
    }),
    enabled: !!selectedSurveyId
  })

  const addSingleMutation = useMutation({
    mutationFn: ({ surveyId, address }: { surveyId: string, address: string }) =>
      addWhitelistEntry(surveyId, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist-entries', selectedSurveyId] })
      setIsAddDialogOpen(false)
      setNewAddress('')
      notifications.success('Address Added', 'Wallet address has been added to whitelist')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to add address to whitelist'
      notifications.error('Failed to Add', errorMessage)
    }
  })

  const bulkAddMutation = useMutation({
    mutationFn: bulkAddWhitelistEntries,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whitelist-entries', selectedSurveyId] })
      setIsBulkDialogOpen(false)
      setBulkAddresses('')
      notifications.success('Bulk Import Complete', `${data.length} addresses added to whitelist`)
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to import addresses'
      notifications.error('Bulk Import Failed', errorMessage)
    }
  })

  const removeMutation = useMutation({
    mutationFn: ({ surveyId, entryId }: { surveyId: string, entryId: string }) =>
      removeWhitelistEntry(surveyId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist-entries', selectedSurveyId] })
      notifications.success('Address Removed', 'Address has been removed from whitelist')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to remove address'
      notifications.error('Removal Failed', errorMessage)
    }
  })

  const toggleMutation = useMutation({
    mutationFn: ({ surveyId, entryId, isActive }: { surveyId: string, entryId: string, isActive: boolean }) =>
      toggleWhitelistEntry(surveyId, entryId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist-entries', selectedSurveyId] })
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to toggle address status'
      notifications.error('Toggle Failed', errorMessage)
    }
  })

  const clearAllMutation = useMutation({
    mutationFn: clearWhitelist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist-entries', selectedSurveyId] })
      notifications.success('Whitelist Cleared', 'All addresses have been removed from whitelist')
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to clear whitelist'
      notifications.error('Clear Failed', errorMessage)
    }
  })

  const importCSVMutation = useMutation({
    mutationFn: ({ surveyId, file }: { surveyId: string, file: File }) =>
      importWhitelistFromCSV(surveyId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whitelist-entries', selectedSurveyId] })
      notifications.success('CSV Import Complete', `${data.length} addresses imported`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: any) => {
      const errorMessage = error.error?.message || error.message || 'Failed to import CSV file'
      notifications.error('CSV Import Failed', errorMessage)
    }
  })

  const handleAddSingle = () => {
    if (!selectedSurveyId || !newAddress.trim()) return
    addSingleMutation.mutate({ surveyId: selectedSurveyId, address: newAddress.trim() })
  }

  const handleBulkAdd = () => {
    if (!selectedSurveyId || !bulkAddresses.trim()) return
    
    const addresses = bulkAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)

    if (addresses.length === 0) return

    bulkAddMutation.mutate({ 
      surveyId: selectedSurveyId, 
      walletAddresses: addresses 
    })
  }

  const handleRemove = (entryId: string) => {
    if (!selectedSurveyId) return
    if (confirm('Are you sure you want to remove this address from the whitelist?')) {
      removeMutation.mutate({ surveyId: selectedSurveyId, entryId })
    }
  }

  const handleToggle = (entryId: string, currentStatus: boolean) => {
    if (!selectedSurveyId) return
    toggleMutation.mutate({ 
      surveyId: selectedSurveyId, 
      entryId, 
      isActive: !currentStatus 
    })
  }

  const handleClearAll = () => {
    if (!selectedSurveyId) return
    if (confirm('Are you sure you want to remove ALL addresses from this whitelist? This action cannot be undone.')) {
      clearAllMutation.mutate(selectedSurveyId)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedSurveyId) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      notifications.error('Invalid File', 'Please select a CSV or JSON file')
      return
    }

    // For CSV files, parse and extract wallet addresses
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const csvContent = e.target?.result as string
        const lines = csvContent.split('\n')
        const walletAddresses: string[] = []
        
        // Skip header line, parse remaining lines
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          // Split by semicolon (as seen in the example file)
          const columns = line.split(';')
          if (columns.length > 0) {
            const walletAddress = columns[0].trim()
            // Basic validation for Ethereum address
            if (walletAddress.startsWith('0x') && walletAddress.length === 42) {
              walletAddresses.push(walletAddress)
            }
          }
        }

        if (walletAddresses.length === 0) {
          notifications.error('No Valid Addresses', 'No valid wallet addresses found in the CSV file')
          return
        }

        // Bulk add the addresses
        bulkAddMutation.mutate({
          surveyId: selectedSurveyId,
          walletAddresses
        })
      }
      reader.readAsText(file)
    } else {
      // For other files, use the original API
      importCSVMutation.mutate({ surveyId: selectedSurveyId, file })
    }
  }

  const exportToCSV = () => {
    if (!whitelistData?.entries.length) return

    const csvContent = [
      'Wallet Address,Status,Created At,Created By',
      ...whitelistData.entries.map(entry => 
        `${entry.walletAddress},${entry.isActive ? 'Active' : 'Inactive'},${entry.createdAt},${entry.createdBy}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whitelist-${selectedSurveyId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const surveys = surveysData?.surveys || []
  const entries = whitelistData?.entries || []
  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId)

  return (
    <div className="space-y-6">
      {/* Survey Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Survey</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose a survey to manage its whitelist" />
            </SelectTrigger>
            <SelectContent>
              {surveys.map(survey => (
                <SelectItem key={survey.id} value={survey.id}>
                  {survey.name} ({survey.company})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSurveyId && (
        <>
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Single
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Address to Whitelist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Wallet Address</label>
                      <Input
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="0x..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddSingle}
                        disabled={addSingleMutation.isPending || !newAddress.trim()}
                      >
                        {addSingleMutation.isPending ? 'Adding...' : 'Add Address'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Bulk Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Add Addresses</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Wallet Addresses (one per line)</label>
                      <Textarea
                        value={bulkAddresses}
                        onChange={(e) => setBulkAddresses(e.target.value)}
                        placeholder="0x1234...&#10;0x5678...&#10;0x9abc..."
                        rows={8}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleBulkAdd}
                        disabled={bulkAddMutation.isPending || !bulkAddresses.trim()}
                      >
                        {bulkAddMutation.isPending ? 'Adding...' : 'Add Addresses'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={importCSVMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToCSV}
                disabled={!entries.length}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>

              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending || !entries.length}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Whitelist Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Whitelist for {selectedSurvey?.name}
                  <Badge variant="secondary" className="ml-2">
                    {whitelistData?.totalEntries || 0} addresses
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Whitelist</h3>
                  <p className="text-gray-600">{error.message}</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'No addresses match your search criteria.'
                      : 'This survey has no whitelist entries yet.'
                    }
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Address
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">
                          {entry.walletAddress}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.isActive ? "default" : "secondary"}>
                            {entry.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {entry.createdBy}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggle(entry.id, entry.isActive)}
                              disabled={toggleMutation.isPending}
                            >
                              {entry.isActive ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemove(entry.id)}
                              disabled={removeMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}