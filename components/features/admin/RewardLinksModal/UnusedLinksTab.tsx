import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Copy, Calendar, Trash2 } from 'lucide-react'
import type { RewardLinksData } from '@/lib/types'
import type { UseMutationResult } from '@tanstack/react-query'

interface UnusedLinksTabProps {
  rewardData: RewardLinksData
  onDeleteLink: (rewardId: string) => void
  onCopyToClipboard: (text: string) => void
  formatDate: (dateString: string) => string
  deleteLinkMutation: UseMutationResult<any, any, string, unknown>
}

export function UnusedLinksTab({
  rewardData,
  onDeleteLink,
  onCopyToClipboard,
  formatDate,
  deleteLinkMutation
}: UnusedLinksTabProps) {
  return (
    <div className="h-full overflow-y-auto space-y-2">
      {rewardData.unused.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No available reward links</p>
          <p className="text-sm">Add some links in the Manage tab</p>
        </div>
      ) : (
        rewardData.unused.map((link) => (
          <div key={link.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-green-600" />
                <span className="font-mono text-sm truncate max-w-md">
                  {link.claimLink}
                </span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Available
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                Added {formatDate(link.createdAt)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyToClipboard(link.claimLink)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteLink(link.id)}
                disabled={deleteLinkMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}