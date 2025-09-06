'use client'

import { Button } from '@/components/ui/button'
import { 
  Upload, 
  Trash2, 
  File,
} from 'lucide-react'

interface ManageTabProps {
  selectedFile: File | null
  txtData: string
  fileInputRef: React.RefObject<HTMLInputElement>
  importTxtMutation: { isPending: boolean }
  clearAllMutation: { isPending: boolean }
  handleFileSelect: () => void
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveFile: () => void
  handleImportFile: () => void
  handleClearAll: () => void
}

export function ManageTab({
  selectedFile,
  txtData,
  fileInputRef,
  importTxtMutation,
  clearAllMutation,
  handleFileSelect,
  handleFileUpload,
  handleRemoveFile,
  handleImportFile,
  handleClearAll,
}: ManageTabProps) {
  return (
    <div className="space-y-6">
      {/* Import from File */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium">Import Reward Links</h4>
          <p className="text-sm text-gray-600 mt-1">Upload a .txt file with one reward link per line</p>
        </div>
        
        {/* File selection */}
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-4">Select a .txt file to import reward links</p>
            <Button 
              onClick={handleFileSelect}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {txtData.trim() ? `${txtData.trim().split('\n').filter(line => line.trim()).length} links` : '0 links'} • {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleRemoveFile}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleImportFile}
                disabled={importTxtMutation.isPending || !txtData.trim()}
                className="min-w-[120px]"
              >
                <Upload className="w-4 h-4 mr-2" />
                {importTxtMutation.isPending ? 'Importing...' : 'Import Links'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="space-y-3 pt-6 border-t">
        <h4 className="font-medium text-red-600">Danger Zone</h4>
        <Button 
          onClick={handleClearAll}
          disabled={clearAllMutation.isPending}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Reward Links
        </Button>
      </div>
    </div>
  )
}