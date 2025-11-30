'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/loading-states'
import {
  PlusCircle,
  Search,
  Filter,
  Upload,
  RefreshCw,
  FileText,
  CheckCircle
} from 'lucide-react'
import { SurveyType } from '@/lib/types'

interface SurveyActionsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void
  typeFilter: SurveyType | 'all'
  onTypeFilterChange: (value: SurveyType | 'all') => void
  onRefreshStats: () => void
  isRefreshStatsPending: boolean
  onCreateSurvey: () => void
  isImportDialogOpen: boolean
  onImportDialogChange: (open: boolean) => void
  importFile: File | null
  importResults: {
    imported: number
    failed: number
    errors?: Array<{ survey: string, error: string }>
  } | null
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onResetImport: () => void
  isImportPending: boolean
}

export function SurveyActions({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onRefreshStats,
  isRefreshStatsPending,
  onCreateSurvey,
  isImportDialogOpen,
  onImportDialogChange,
  importFile,
  importResults,
  onFileSelect,
  onImport,
  onResetImport,
  isImportPending
}: SurveyActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex flex-1 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search surveys..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-36">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={onTypeFilterChange as (value: string) => void}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={SurveyType.STANDARD}>Standard</SelectItem>
            <SelectItem value={SurveyType.PREDICTION}>Prediction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onRefreshStats}
          disabled={isRefreshStatsPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshStatsPending ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>

        <Dialog open={isImportDialogOpen} onOpenChange={onImportDialogChange}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Surveys
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Surveys</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {!importResults ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select JSON File
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={onFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    
                    {importFile && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          Selected: {importFile.name}
                        </span>
                      </div>
                    )}
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Expected Format:</h4>
                      <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "surveys": [
    {
      "name": "Survey Name",
      "company": "Company Name", 
      "description": "Description",
      "detailedDescription": "Detailed description",
      "criteria": "Criteria",
      "rewardAmount": 0.01,
      "rewardToken": "ETH",
      "heardPointsReward": 50,
      "questions": [...],
      "whitelist": [...]
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={onResetImport}
                      disabled={isImportPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={onImport}
                      disabled={!importFile || isImportPending}
                    >
                      {isImportPending ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Surveys
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-medium">Import Results</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-md">
                        <div className="text-2xl font-bold text-green-700">
                          {importResults.imported}
                        </div>
                        <div className="text-sm text-green-600">
                          Successfully Imported
                        </div>
                      </div>
                      
                      {importResults.failed > 0 && (
                        <div className="p-3 bg-red-50 rounded-md">
                          <div className="text-2xl font-bold text-red-700">
                            {importResults.failed}
                          </div>
                          <div className="text-sm text-red-600">
                            Failed to Import
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-red-700">Errors:</h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {importResults.errors.map((error, index) => (
                            <div key={index} className="p-2 bg-red-50 rounded text-sm">
                              <div className="font-medium text-red-700">
                                {error.survey}
                              </div>
                              <div className="text-red-600">
                                {error.error}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={onResetImport}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={onCreateSurvey}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Survey
        </Button>
      </div>
    </div>
  )
}