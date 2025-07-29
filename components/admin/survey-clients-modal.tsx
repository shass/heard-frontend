'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Trash2, 
  Users, 
  Wallet, 
  Settings,
  Eye,
  EyeOff,
  Crown,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  useSurveyClients, 
  useAddSurveyClient, 
  useUpdateSurveyClient, 
  useRemoveSurveyClient,
  useSurveyVisibility,
  useUpdateSurveyVisibility,
  useGenerateShareLink
} from '@/hooks/use-survey-clients'
import { toast } from 'sonner'

// Wallet address validation schema
const walletAddressSchema = z
  .string()
  .min(42, 'Wallet address must be 42 characters')
  .max(42, 'Wallet address must be 42 characters')
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address format')

interface SurveyClientsModalProps {
  survey: { id: string; name: string; company?: string } | null
  isOpen: boolean
  onClose: () => void
}

const addClientSchema = z.object({
  walletAddress: walletAddressSchema,
  canMakePublic: z.boolean().default(true),
})

type AddClientForm = z.infer<typeof addClientSchema>

export function SurveyClientsModal({ survey, isOpen, onClose }: SurveyClientsModalProps) {
  const [activeTab, setActiveTab] = useState<'clients' | 'visibility'>('clients')
  
  const { data: clients, isLoading: clientsLoading } = useSurveyClients(survey?.id || '')
  const { data: visibility, isLoading: visibilityLoading } = useSurveyVisibility(survey?.id || '')
  
  const addClient = useAddSurveyClient()
  const updateClient = useUpdateSurveyClient()
  const removeClient = useRemoveSurveyClient()
  const updateVisibility = useUpdateSurveyVisibility()
  const generateLink = useGenerateShareLink()

  const form = useForm<AddClientForm>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      walletAddress: '',
      canMakePublic: true,
    }
  })

  const handleAddClient = async (data: AddClientForm) => {
    if (!survey?.id) return
    
    try {
      await addClient.mutateAsync({
        surveyId: survey.id,
        request: data
      })
      form.reset()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleUpdateClientPermission = async (walletAddress: string, canMakePublic: boolean) => {
    if (!survey?.id) return
    
    try {
      await updateClient.mutateAsync({
        surveyId: survey.id,
        walletAddress,
        request: { canMakePublic }
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleRemoveClient = async (walletAddress: string) => {
    if (!survey?.id) return
    
    if (!confirm('Remove this client from the survey? They will lose access to results.')) {
      return
    }
    
    try {
      await removeClient.mutateAsync({
        surveyId: survey.id,
        walletAddress
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleVisibilityChange = async (mode: 'private' | 'public' | 'link') => {
    if (!survey?.id) return
    
    try {
      await updateVisibility.mutateAsync({
        surveyId: survey.id,
        request: { visibilityMode: mode }
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleGenerateLink = async () => {
    if (!survey?.id) return
    
    try {
      await generateLink.mutateAsync(survey.id)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    }
  }

  const openResults = () => {
    if (!survey?.id) return
    const url = `/surveys/${survey.id}/results`
    window.open(url, '_blank')
  }

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
          {activeTab === 'clients' && (
            <div className="space-y-6 p-1">
              {/* Add Client Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Survey Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(handleAddClient)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="walletAddress">Wallet Address</Label>
                        <Input
                          {...form.register('walletAddress')}
                          placeholder="0x..."
                          className="font-mono text-sm"
                        />
                        {form.formState.errors.walletAddress && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.walletAddress.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          type="submit"
                          disabled={addClient.isPending}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Client
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="canMakePublic"
                        checked={form.watch('canMakePublic')}
                        onCheckedChange={(checked) => form.setValue('canMakePublic', checked)}
                      />
                      <Label htmlFor="canMakePublic" className="text-sm">
                        Can manage survey visibility
                      </Label>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Clients List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : !clients?.length ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No survey clients added yet</p>
                      <p className="text-sm">Add clients above to give them access to survey results</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <code className="font-mono text-sm">{client.walletAddress}</code>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={client.canMakePublic ? 'default' : 'secondary'}>
                                  {client.canMakePublic ? (
                                    <>
                                      <Crown className="h-3 w-3 mr-1" />
                                      Can Manage Visibility
                                    </>
                                  ) : (
                                    'View Only'
                                  )}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Added {new Date(client.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={client.canMakePublic}
                              onCheckedChange={(checked) => 
                                handleUpdateClientPermission(client.walletAddress, checked)
                              }
                              disabled={updateClient.isPending}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveClient(client.walletAddress)}
                              disabled={removeClient.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Survey clients are automatically added to the survey whitelist and can view 
                  private results. Clients with "Can Manage Visibility" permission can also 
                  change how survey results are shared.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="space-y-6 p-1">
              {/* Current Visibility Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  {visibilityLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  ) : visibility ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {visibility.visibilityMode === 'public' ? (
                            <Eye className="h-5 w-5 text-green-600" />
                          ) : visibility.visibilityMode === 'link' ? (
                            <ExternalLink className="h-5 w-5 text-blue-600" />
                          ) : (
                            <EyeOff className="h-5 w-5 text-gray-600" />
                          )}
                          <div>
                            <div className="font-medium capitalize">
                              {visibility.visibilityMode} Access
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {visibility.visibilityMode === 'public' 
                                ? 'Anyone can view results without authentication'
                                : visibility.visibilityMode === 'link'
                                ? 'Results accessible via special shareable link'
                                : 'Only admins and survey clients can view results'
                              }
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openResults}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Visibility Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Change Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {/* Private */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        visibility?.visibilityMode === 'private'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleVisibilityChange('private')}
                    >
                      <div className="flex items-center gap-3">
                        <EyeOff className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Private</div>
                          <div className="text-sm text-muted-foreground">
                            Only admins and survey clients can view
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Public */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        visibility?.visibilityMode === 'public'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleVisibilityChange('public')}
                    >
                      <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Public</div>
                          <div className="text-sm text-muted-foreground">
                            Anyone can view without authentication
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Link */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        visibility?.visibilityMode === 'link'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleVisibilityChange('link')}
                    >
                      <div className="flex items-center gap-3">
                        <ExternalLink className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Link Access</div>
                          <div className="text-sm text-muted-foreground">
                            Accessible via special shareable link
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Link Management */}
              {visibility?.visibilityMode === 'link' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Share Link</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Generate a secure link for sharing survey results
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateLink}
                        disabled={generateLink.isPending}
                      >
                        {visibility.shareUrl ? 'Regenerate' : 'Generate'} Link
                      </Button>
                    </div>

                    {visibility.shareUrl && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-sm font-mono break-all">
                          {visibility.shareUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(visibility.shareUrl!, 'Share link')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(visibility.shareUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {visibility?.visibilityChangedAt && (
                <div className="text-xs text-muted-foreground text-center">
                  Last changed: {new Date(visibility.visibilityChangedAt).toLocaleString()}
                </div>
              )}
            </div>
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