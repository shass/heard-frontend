import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Download, User } from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'

interface ResponsesHeaderProps {
  survey: AdminSurveyListItem
  searchTerm: string
  onSearchChange: (value: string) => void
  onExportResponses: () => void
}

export function ResponsesHeader({
  survey,
  searchTerm,
  onSearchChange,
  onExportResponses
}: ResponsesHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5" />
        <span className="font-semibold">Survey Responses: {survey.name}</span>
      </div>

      {/* Header with search and export */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by wallet address..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={onExportResponses}
          className="shrink-0"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </>
  )
}