'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import { 
  ExternalLink, 
  Copy, 
  User, 
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { PaginationControls } from './PaginationControls'
import type { UsedRewardLink, PaginationMeta } from '@/lib/types'

interface UsedLinksTabProps {
  isLoading: boolean
  error: any
  rewardData: {
    links: UsedRewardLink[]
    meta: PaginationMeta
  } | null | undefined
  search: string
  copyToClipboard: (text: string) => void
  onPageChange: (newOffset: number) => void
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function UsedLinksTab({
  isLoading,
  error,
  rewardData,
  search,
  copyToClipboard,
  onPageChange,
}: UsedLinksTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertTriangle className="w-8 h-8 mr-2" />
        Failed to load reward links
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2">
        {!rewardData?.links || rewardData.links.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No used reward links found</p>
            {search ? (
              <p className="text-sm">Try adjusting your search criteria</p>
            ) : (
              <p className="text-sm">Links used by users will appear here</p>
            )}
          </div>
        ) : (
          rewardData.links.map((link) => (
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
      {rewardData?.meta && (
        <PaginationControls meta={rewardData.meta} onPageChange={onPageChange} />
      )}
    </>
  )
}