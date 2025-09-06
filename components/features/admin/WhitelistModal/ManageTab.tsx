import { SearchBar } from './SearchBar'
import { AddressTable } from './AddressTable'
import { Pagination } from './Pagination'
import { EmptyState } from './EmptyState'
import { LoadingErrorStates } from './LoadingErrorStates'

interface PagedData {
  addresses: Array<{
    address: string
    hasCompleted: boolean
    completedAt?: string
  }>
  pagination: {
    total: number
    filtered: number
    hasMore: boolean
  }
}

interface ManageTabProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  pagedData: PagedData | null | undefined
  isLoading: boolean
  error: Error | null
  onRemoveAddress: (address: string) => void
  isRemoving: boolean
  currentPage: number
  itemsPerPage: number
  onPageChange: (newPage: number) => void
  onUploadClick: () => void
}

export function ManageTab({
  searchTerm,
  onSearchChange,
  pagedData,
  isLoading,
  error,
  onRemoveAddress,
  isRemoving,
  currentPage,
  itemsPerPage,
  onPageChange,
  onUploadClick
}: ManageTabProps) {
  return (
    <div className="flex-1 space-y-4 mt-6">
      {/* Search Bar */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        totalAddresses={pagedData?.pagination.total}
        filteredAddresses={pagedData?.pagination.filtered}
      />
      
      {/* Content */}
      <LoadingErrorStates isLoading={isLoading} error={error} />
      
      {!isLoading && !error && !pagedData?.addresses.length && (
        <EmptyState searchTerm={searchTerm} onUploadClick={onUploadClick} />
      )}
      
      {!isLoading && !error && pagedData?.addresses.length ? (
        <>
          <AddressTable
            addresses={pagedData.addresses}
            onRemoveAddress={onRemoveAddress}
            isRemoving={isRemoving}
          />
          
          {/* Pagination */}
          {pagedData.pagination.total > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalFiltered={pagedData.pagination.filtered}
              hasMore={pagedData.pagination.hasMore}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : null}
    </div>
  )
}