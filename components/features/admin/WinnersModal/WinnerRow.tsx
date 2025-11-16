'use client'

import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Copy, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Winner } from '@/lib/types'

interface WinnerRowProps {
  winner: Winner
  onDeleteClick: (winnerId: string) => void
}

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const handleCopyAddress = (address: string) => {
  navigator.clipboard.writeText(address)
  toast.success('Address copied to clipboard')
}

const handleCopyLink = (link: string) => {
  navigator.clipboard.writeText(link)
  toast.success('Reward link copied to clipboard')
}

export function WinnerRow({ winner, onDeleteClick }: WinnerRowProps) {
  return (
    <TableRow>
      <TableCell className="font-mono">
        <div className="flex items-center gap-2">
          <span>{truncateAddress(winner.walletAddress)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyAddress(winner.walletAddress)}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <a
            href={winner.rewardLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Link
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyLink(winner.rewardLink)}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>{winner.place || '—'}</TableCell>
      <TableCell>{winner.rewardType || '—'}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteClick(winner.id)}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
