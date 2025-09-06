'use client'

import { Button } from '@/components/ui/button'
import { 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import type { PaginationMeta } from '@/lib/types'

interface PaginationControlsProps {
  meta: PaginationMeta
  onPageChange: (newOffset: number) => void
}

export function PaginationControls({ meta, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.ceil(meta.total / meta.limit)
  const currentPage = Math.floor(meta.offset / meta.limit) + 1
  const hasNextPage = meta.hasMore
  const hasPrevPage = meta.offset > 0

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Showing {Math.min(meta.offset + 1, meta.total)} to {Math.min(meta.offset + meta.limit, meta.total)} of {meta.total} links
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(0)}
          disabled={!hasPrevPage}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, meta.offset - meta.limit))}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.offset + meta.limit)}
          disabled={!hasNextPage}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((totalPages - 1) * meta.limit)}
          disabled={!hasNextPage}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}