import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle } from 'lucide-react'
import type { FileProcessingResult } from '@/lib/whitelist/WhitelistFileProcessor'

interface ProcessingResultsProps {
  processingResult: FileProcessingResult | null
  uploadState: string
}

export function ProcessingResults({ processingResult, uploadState }: ProcessingResultsProps) {
  if (uploadState !== 'ready' || !processingResult) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Ready to Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {processingResult.stats.validCount.toLocaleString()}
            </div>
            <div className="text-gray-600">Valid addresses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {processingResult.stats.duplicateCount.toLocaleString()}
            </div>
            <div className="text-gray-600">Duplicates removed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {processingResult.stats.invalidCount.toLocaleString()}
            </div>
            <div className="text-gray-600">Invalid addresses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {processingResult.stats.estimatedUploadTime}
            </div>
            <div className="text-gray-600">Estimated time</div>
          </div>
        </div>
        
        {processingResult.invalidAddresses.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Invalid addresses found (first 5 shown):
              </span>
            </div>
            <div className="text-xs text-red-700 space-y-1">
              {processingResult.invalidAddresses.slice(0, 5).map((error, index) => (
                <div key={index}>
                  Line {error.line}: {error.value} - {error.error}
                </div>
              ))}
              {processingResult.invalidAddresses.length > 5 && (
                <div className="text-red-600">
                  ...and {processingResult.invalidAddresses.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}