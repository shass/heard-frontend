import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  itemsPerPage: number
  totalFiltered: number
  hasMore: boolean
  onPageChange: (newPage: number) => void
}

export function Pagination({ 
  currentPage, 
  itemsPerPage, 
  totalFiltered, 
  hasMore, 
  onPageChange 
}: PaginationProps) {
  const startItem = currentPage * itemsPerPage + 1
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalFiltered)
  const totalPages = Math.ceil(totalFiltered / itemsPerPage)

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Showing {startItem} to {endItem} of {totalFiltered} addresses
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  )
}