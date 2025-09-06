import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Copy, Calendar, User } from 'lucide-react'
import type { RewardLinksData } from '@/lib/types'

interface UsedLinksTabProps {
  rewardData: RewardLinksData
  onCopyToClipboard: (text: string) => void
  formatDate: (dateString: string) => string
}

export function UsedLinksTab({
  rewardData,
  onCopyToClipboard,
  formatDate
}: UsedLinksTabProps) {
  return (
    <div className="h-full overflow-y-auto space-y-2">
      {rewardData.used.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No used reward links</p>
          <p className="text-sm">Links used by users will appear here</p>
        </div>
      ) : (
        rewardData.used.map((link) => (
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
              onClick={() => onCopyToClipboard(link.claimLink)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  )
}