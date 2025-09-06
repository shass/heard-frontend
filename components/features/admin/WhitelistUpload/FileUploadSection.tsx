import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, X } from 'lucide-react'

interface FileUploadSectionProps {
  selectedFile: File | null
  textareaAddresses: string
  onTextareaChange: (value: string) => void
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: () => void
  onClearTextarea: () => void
  isWorking: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export function FileUploadSection({
  selectedFile,
  textareaAddresses,
  onTextareaChange,
  onFileSelect,
  onRemoveFile,
  onClearTextarea,
  isWorking,
  fileInputRef
}: FileUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Whitelist Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Upload File (.txt or .csv)
            </label>

            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center h-40 flex flex-col justify-center">
                <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-3">Select a file to import addresses</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isWorking || textareaAddresses.trim().length > 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 h-40 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{selectedFile.name}</div>
                      <div className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemoveFile}
                    disabled={isWorking}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              accept=".txt,.csv"
              className="hidden"
            />
          </div>

          {/* OR Divider for small screens */}
          <div className="lg:hidden flex items-center gap-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500 bg-white px-3">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Textarea Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Paste addresses (one per line)
            </label>
            <div className="relative">
              <Textarea
                value={textareaAddresses}
                onChange={(e) => onTextareaChange(e.target.value)}
                placeholder={`0x1234567890123456789012345678901234567890\n0x0987654321098765432109876543210987654321\n0x...`}
                rows={6}
                disabled={isWorking || !!selectedFile}
                className="resize-none font-mono text-sm h-40"
              />
              {textareaAddresses.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearTextarea}
                  disabled={isWorking || !!selectedFile}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {textareaAddresses.trim() && (
              <div className="text-xs text-gray-500">
                {textareaAddresses.split('\n').filter(addr => addr.trim().length > 0).length} addresses entered
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}