'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-states"
import { X, TrendingUp, TrendingDown, Gift, Settings } from "lucide-react"
import { useHerdPointsHistory } from "@/hooks/use-users"
import { useUser } from "@/lib/store"
import type { HerdPointsTransaction } from "@/lib/types"
import { formatDistance } from 'date-fns'

interface HerdPointsHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HerdPointsHistoryModal({ isOpen, onClose }: HerdPointsHistoryModalProps) {
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent' | 'bonus' | 'admin_adjustment'>('all')
  const user = useUser()
  
  const { 
    data: history, 
    isLoading, 
    error,
    refetch
  } = useHerdPointsHistory({ 
    limit: 50, 
    type: filterType === 'all' ? undefined : filterType 
  })

  useEffect(() => {
    if (isOpen) {
      refetch()
    }
  }, [isOpen, refetch])

  const getTransactionIcon = (type: HerdPointsTransaction['type']) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'spent':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'bonus':
        return <Gift className="w-4 h-4 text-purple-600" />
      case 'admin_adjustment':
        return <Settings className="w-4 h-4 text-blue-600" />
      default:
        return <div className="w-4 h-4 bg-zinc-400 rounded-full" />
    }
  }

  const getTransactionColor = (type: HerdPointsTransaction['type']) => {
    switch (type) {
      case 'earned':
      case 'bonus':
        return 'text-green-600'
      case 'spent':
        return 'text-red-600'
      case 'admin_adjustment':
        return 'text-blue-600'
      default:
        return 'text-zinc-600'
    }
  }

  const formatAmount = (amount: number, type: HerdPointsTransaction['type']) => {
    const prefix = type === 'earned' || type === 'bonus' || (type === 'admin_adjustment' && amount > 0) ? '+' : ''
    return `${prefix}${amount.toLocaleString()}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">HerdPoints History</h2>
            <p className="text-sm text-zinc-600">
              Current Balance: {user?.herdPointsBalance?.toLocaleString() || 0} HP
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-zinc-200">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'earned', label: 'Earned' },
              { value: 'spent', label: 'Spent' },
              { value: 'bonus', label: 'Bonus' },
              { value: 'admin_adjustment', label: 'Adjustments' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterType(value as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterType === value
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <LoadingState
            loading={isLoading}
            error={error ? 'Failed to load transaction history' : null}
            empty={!history?.transactions?.length}
            emptyMessage="No transactions found"
          >
            {history?.transactions && (
              <div className="space-y-4">
                {history.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg border border-zinc-200"
                  >
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="font-medium text-zinc-900">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-zinc-600">
                          {formatDistance(new Date(transaction.createdAt), new Date(), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {formatAmount(transaction.amount, transaction.type)} HP
                      </div>
                      <div className="text-sm text-zinc-600">
                        Balance: {transaction.balanceAfter.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </LoadingState>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-200 bg-zinc-50">
          <div className="text-sm text-zinc-600">
            {history?.total ? `Showing ${history.transactions?.length} of ${history.total} transactions` : ''}
          </div>
          <Button
            onClick={onClose}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}