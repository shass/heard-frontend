'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getWhitelistEntries,
  bulkAddWhitelistEntries,
  clearWhitelist
} from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import { 
  Save, 
  Trash2, 
  Users,
  AlertTriangle
} from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'

interface WhitelistModalProps {
  survey: AdminSurveyListItem | null
  isOpen: boolean
  onClose: () => void
}

export function WhitelistModal({ survey, isOpen, onClose }: WhitelistModalProps) {
  const [addresses, setAddresses] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  
  const notifications = useNotifications()
  const queryClient = useQueryClient()

  // Get current whitelist
  const { data: whitelistData, isLoading, error } = useQuery({
    queryKey: ['whitelist', survey?.id],
    queryFn: () => survey ? getWhitelistEntries(survey.id) : Promise.resolve(null),
    enabled: !!survey && isOpen
  })

  // Set initial addresses when data loads
  useEffect(() => {
    if (whitelistData?.entries) {
      const addressList = whitelistData.entries.join('\n')
      setAddresses(addressList)
      setHasChanges(false)
    }
  }, [whitelistData])

  // Save whitelist mutation
  const saveWhitelistMutation = useMutation({
    mutationFn: async (newAddresses: string[]) => {
      if (!survey) throw new Error('No survey selected')
      
      // Clear existing whitelist first, then add new addresses
      await clearWhitelist(survey.id)
      
      if (newAddresses.length > 0) {
        await bulkAddWhitelistEntries({
          surveyId: survey.id,
          walletAddresses: newAddresses
        })
      }
    },
    onSuccess: () => {
      notifications.success('Whitelist updated', 'Whitelist has been successfully updated')
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['whitelist', survey?.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: (error: any) => {
      notifications.error('Failed to update whitelist', error.message || 'Please try again')
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
      setAddresses('')
      setHasChanges(true)
      queryClient.invalidateQueries({ queryKey: ['whitelist', survey?.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-surveys'] })
    },
    onError: (error: any) => {
      notifications.error('Failed to clear whitelist', error.message || 'Please try again')
    }
  })

  const handleAddressesChange = (value: string) => {
    setAddresses(value)
    setHasChanges(true)
  }

  const handleSave = () => {
    if (!survey) return
    
    // Parse and validate addresses
    const addressList = addresses
      .split('\n')
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => addr.length > 0)
    
    // Basic validation for wallet addresses
    const invalidAddresses = addressList.filter(addr => 
      !addr.match(/^0x[a-fA-F0-9]{40}$/)
    )
    
    if (invalidAddresses.length > 0) {
      notifications.error(
        'Invalid wallet addresses', 
        `Found ${invalidAddresses.length} invalid address(es). Please check the format.`
      )
      return
    }

    saveWhitelistMutation.mutate(addressList)
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all addresses from this whitelist?')) {
      clearWhitelistMutation.mutate()
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!survey) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Whitelist Management - {survey.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Failed to load whitelist
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Wallet Addresses (one per line)
                </label>
                <Textarea
                  value={addresses}
                  onChange={(e) => handleAddressesChange(e.target.value)}
                  placeholder="0x1234567890123456789012345678901234567890&#10;0xabcdefabcdefabcdefabcdefabcdefabcdefabcd&#10;..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Current count: {addresses.split('\n').filter(addr => addr.trim().length > 0).length} addresses
                </p>
              </div>

              {hasChanges && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">You have unsaved changes</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={clearWhitelistMutation.isPending || addresses.trim().length === 0}
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
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveWhitelistMutation.isPending || !hasChanges}
            >
              {saveWhitelistMutation.isPending ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}