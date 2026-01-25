'use client'

import { useState } from 'react'
import { ConfigUIProps } from '@/src/core/interfaces/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface WhitelistConfig {
  addresses: string[]
}

export function WhitelistConfigUI({ config, onChange }: ConfigUIProps) {
  const whitelistConfig = (config || { addresses: [] }) as WhitelistConfig
  const [newAddress, setNewAddress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isValidAddress = (address: string): boolean => {
    // Accept any non-empty string (supports Ethereum, Solana, Bitcoin, etc.)
    return address.length > 0 && /\S/.test(address)
  }

  const handleAddAddress = () => {
    setError(null)

    if (!newAddress.trim()) {
      setError('Please enter a wallet address')
      return
    }

    const trimmedAddress = newAddress.trim()

    if (!isValidAddress(trimmedAddress)) {
      setError('Invalid address format')
      return
    }

    const normalizedAddress = trimmedAddress.toLowerCase()

    if (whitelistConfig.addresses.some(addr => addr.toLowerCase() === normalizedAddress)) {
      setError('Address already exists in whitelist')
      return
    }

    const updatedConfig = {
      ...whitelistConfig,
      addresses: [...whitelistConfig.addresses, trimmedAddress]
    }

    onChange(updatedConfig)
    setNewAddress('')
  }

  const handleRemoveAddress = (addressToRemove: string) => {
    const updatedConfig = {
      ...whitelistConfig,
      addresses: whitelistConfig.addresses.filter(addr => addr !== addressToRemove)
    }
    onChange(updatedConfig)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddAddress()
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-medium text-zinc-900">Whitelist Configuration</h3>
          <p className="text-sm text-zinc-600 mt-1">
            Add wallet addresses that are allowed to access this survey
          </p>
        </div>

        {/* Add address form */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="wallet-address"
                type="text"
                placeholder="Enter wallet address (any blockchain)"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleAddAddress} type="button">
                Add Address
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Address list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Whitelisted Addresses ({whitelistConfig.addresses.length})</Label>
          </div>

          {whitelistConfig.addresses.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-300 rounded-lg">
              No addresses added yet
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200 max-h-80 overflow-y-auto">
              {whitelistConfig.addresses.map((address, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-zinc-50"
                >
                  <code className="text-sm text-zinc-700 font-mono">
                    {address}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAddress(address)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="pt-4 border-t border-zinc-200">
          <p className="text-xs text-zinc-500">
            💡 Only wallets in this list will be able to access and complete the survey.
            Addresses are case-insensitive.
          </p>
        </div>
      </div>
    </Card>
  )
}
