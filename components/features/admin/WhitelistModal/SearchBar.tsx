import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  totalAddresses?: number
  filteredAddresses?: number
}

export function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  totalAddresses = 0, 
  filteredAddresses = 0 
}: SearchBarProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search addresses..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="text-sm text-gray-500">
        {filteredAddresses > 0 && `${filteredAddresses} of ${totalAddresses} addresses`}
      </div>
    </div>
  )
}