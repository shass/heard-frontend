'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Download, User, Loader2, ChevronDown } from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'

interface ExportParams {
  offset: number
  limit: number
}

interface ResponsesHeaderProps {
  survey: AdminSurveyListItem
  searchTerm: string
  onSearchChange: (value: string) => void
  onExportResponses: (params?: ExportParams) => void
  isExporting?: boolean
  totalResponses?: number
  exportLimit: number
}

export function ResponsesHeader({
  survey,
  searchTerm,
  onSearchChange,
  onExportResponses,
  isExporting = false,
  totalResponses = 0,
  exportLimit
}: ResponsesHeaderProps) {
  const [exportOffset, setExportOffset] = useState(0)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const needsPagination = totalResponses > exportLimit

  const handleQuickExport = () => {
    onExportResponses()
  }

  const handleExportWithOffset = () => {
    onExportResponses({ offset: exportOffset, limit: exportLimit })
    setIsPopoverOpen(false)
  }

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

        {needsPagination ? (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={isExporting}
                className="shrink-0"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isExporting ? 'Exporting...' : 'Export CSV'}
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Total responses: <strong>{totalResponses.toLocaleString()}</strong>
                </div>
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Max {exportLimit.toLocaleString()} rows per export
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Start from row:</label>
                  <Input
                    type="number"
                    min={0}
                    max={Math.max(0, totalResponses - 1)}
                    value={exportOffset}
                    onChange={(e) => setExportOffset(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                  />
                  <div className="text-xs text-gray-500">
                    Will export rows {exportOffset + 1} - {Math.min(exportOffset + exportLimit, totalResponses).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportOffset(0)}
                    className="flex-1"
                  >
                    First {exportLimit.toLocaleString()}
                  </Button>
                  {totalResponses > exportLimit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExportOffset(exportLimit)}
                      className="flex-1"
                    >
                      Next batch
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleExportWithOffset}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            variant="outline"
            onClick={handleQuickExport}
            disabled={isExporting}
            className="shrink-0"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        )}
      </div>
    </>
  )
}
