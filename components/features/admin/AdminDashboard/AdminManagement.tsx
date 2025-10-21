'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import { Plus, Shield, Trash2 } from 'lucide-react'
import { useAdminManagement } from './hooks/useAdminManagement'

export function AdminManagement() {
  const {
    admins,
    isLoading,
    newAdminAddress,
    setNewAdminAddress,
    isAddDialogOpen,
    setIsAddDialogOpen,
    adminToRemove,
    isRemoveDialogOpen,
    isAdding,
    isRemoving,
    handleAddAdmin,
    handleRemoveClick,
    handleConfirmRemove,
    handleCancelRemove
  } = useAdminManagement()

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Management
              </CardTitle>
              <CardDescription>
                Manage wallet addresses with admin privileges
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Admin
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No admin users found
            </div>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-mono text-sm font-medium">
                        {admin.walletAddress}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" className="text-xs">
                          Admin
                        </Badge>
                        {admin.createdAt && (
                          <span className="text-xs text-gray-500">
                            Since {new Date(admin.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveClick(admin)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Remove admin privileges"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
            <DialogDescription>
              Enter a wallet address to grant admin privileges. The user must already be registered in the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Wallet Address
              </label>
              <Input
                type="text"
                placeholder="0x..."
                value={newAdminAddress}
                onChange={(e) => setNewAdminAddress(e.target.value)}
                className="font-mono text-sm"
                disabled={isAdding}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The wallet address must already be registered in the system.
                Admin privileges include full access to surveys, users, and platform settings.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAdmin}
                disabled={isAdding || !newAdminAddress.trim()}
              >
                {isAdding ? 'Adding...' : 'Add Admin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Confirmation Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={(open) => !open && handleCancelRemove()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Admin Privileges?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove admin privileges from this wallet?
            </p>

            {adminToRemove && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm">
                  <span className="text-gray-500">Wallet:</span>
                  <div className="font-mono text-xs mt-1 break-all">
                    {adminToRemove.walletAddress}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This user will lose all admin access immediately and will be
                reverted to a regular respondent role.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCancelRemove}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRemoving ? 'Removing...' : 'Remove Admin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
