import { Copy, Check } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { useNotifications } from '@/components/ui/notifications'
import type { Survey } from '@/lib/types'

interface ClaimSectionProps {
  survey: Survey
  qrCodeUrl: string | null
  claimLink?: string
  linkCopied: boolean
  setLinkCopied: (copied: boolean) => void
}

export function ClaimSection({
  survey,
  qrCodeUrl,
  claimLink,
  linkCopied,
  setLinkCopied
}: ClaimSectionProps) {
  const notifications = useNotifications()

  const claimUrl = claimLink || ''

  if (!qrCodeUrl || !claimUrl) return null

  const handleCopyLink = () => {
    navigator.clipboard.writeText(claimUrl)
    notifications.success('Link copied', 'Claim link copied to clipboard')
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1500)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-zinc-900">Claim Your Tokens</h3>
      
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="w-48 h-48 bg-white rounded-lg border-2 border-zinc-200 flex items-center justify-center">
          <img
            src={qrCodeUrl}
            alt="QR Code for reward claim"
            className="w-44 h-44"
          />
        </div>
      </div>
      
      <p className="text-sm text-zinc-600">
        Scan this QR code or use the link below to claim your {formatNumber(survey.rewardAmount)} {survey.rewardToken}
      </p>

      {/* Direct claim link */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <p className="text-sm font-medium text-zinc-700 mb-2">Direct Claim Link:</p>
        <div className="flex items-center gap-2">
          <a
            href={claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-blue-600 hover:text-blue-800 underline break-all bg-white p-2 rounded border flex-1"
          >
            {claimUrl}
          </a>
          <button
            onClick={handleCopyLink}
            className="p-2 bg-white border rounded hover:bg-gray-50 flex-shrink-0"
            title="Copy link"
          >
            {linkCopied ? (
              <Check className="w-4 h-4 text-zinc-900" />
            ) : (
              <Copy className="w-4 h-4 text-zinc-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}