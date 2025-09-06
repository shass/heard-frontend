import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

interface EmptyStateProps {
  searchTerm: string
  onUploadClick: () => void
}

export function EmptyState({ searchTerm, onUploadClick }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
      <p className="text-gray-600">
        {searchTerm ? 'No addresses match your search criteria.' : 'This survey has no whitelist entries yet.'}
      </p>
      {!searchTerm && (
        <Button 
          onClick={onUploadClick} 
          className="mt-4"
          variant="outline"
        >
          Upload Addresses
        </Button>
      )}
    </div>
  )
}