'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Trash2, 
  Users, 
  Wallet, 
  Crown,
  Info,
} from 'lucide-react'
import { AddClientForm } from './hooks/useSurveyClientsModal'
import { UseFormReturn } from 'react-hook-form'

interface Client {
  id: string
  walletAddress: string
  canMakePublic: boolean
  createdAt: string
}

interface ClientsTabProps {
  clients: Client[] | undefined
  clientsLoading: boolean
  form: UseFormReturn<AddClientForm>
  addClient: { isPending: boolean }
  updateClient: { isPending: boolean }
  removeClient: { isPending: boolean }
  handleAddClient: (data: AddClientForm) => Promise<void>
  handleUpdateClientPermission: (walletAddress: string, canMakePublic: boolean) => Promise<void>
  handleRemoveClient: (walletAddress: string) => Promise<void>
}

export function ClientsTab({
  clients,
  clientsLoading,
  form,
  addClient,
  updateClient,
  removeClient,
  handleAddClient,
  handleUpdateClientPermission,
  handleRemoveClient,
}: ClientsTabProps) {
  return (
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
  )
}