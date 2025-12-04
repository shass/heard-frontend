'use client'

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
import { useWinners, useRemoveWinner } from '@/hooks'
import { WinnerRow } from './WinnerRow'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface WinnersTableProps {
  surveyId: string
}

export function WinnersTable({ surveyId }: WinnersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null)

  const { data, isLoading } = useWinners(surveyId, { limit: 50, offset: 0 })
  const removeWinner = useRemoveWinner()

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
              <WinnerRow
                key={winner.id}
                winner={winner}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-zinc-500 mt-2">
        Total winners: {data.pagination.total}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
