'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, ExternalLink, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useWinners, useRemoveWinner } from '@/hooks'
import { toast } from 'sonner'

interface WinnersTableProps {
  surveyId: string
}

export function WinnersTable({ surveyId }: WinnersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null)

  const { data, isLoading } = useWinners(surveyId, { limit: 50, offset: 0 })
  const removeWinner = useRemoveWinner()

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied to clipboard')
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success('Reward link copied to clipboard')
  }

  const handleDeleteClick = (winnerId: string) => {
    setSelectedWinnerId(winnerId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedWinnerId) {
      removeWinner.mutate({ surveyId, winnerId: selectedWinnerId })
      setDeleteDialogOpen(false)
      setSelectedWinnerId(null)
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!data?.winners || data.winners.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No winners yet.</p>
        <p className="text-sm mt-1">Add winners using the form or upload JSON.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet Address</TableHead>
              <TableHead>Reward Link</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Reward Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.winners.map((winner) => (
              <TableRow key={winner.id}>
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
                    onClick={() => handleDeleteClick(winner.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-zinc-500 mt-2">
        Total winners: {data.pagination.total}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the winner record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
