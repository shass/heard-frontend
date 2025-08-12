'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, AlertCircle, CheckCircle2, X, Pause, Play } from 'lucide-react'
import { useChunkedUpload } from '@/lib/services/chunked-upload'
import { useImportProgress } from '@/lib/services/import-websocket'
import { useNotifications } from '@/components/ui/notifications'
import { formatBytes, formatDuration } from '@/lib/utils'

interface LargeFileImportProps {
  surveyId: string
  type: 'whitelist' | 'rewards'
  onComplete?: (result: any) => void
  onCancel?: () => void
}

interface FileValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function LargeFileImport({ surveyId, type, onComplete, onCancel }: LargeFileImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileFormat, setFileFormat] = useState<'txt' | 'csv'>('txt')
  const [replaceExisting, setReplaceExisting] = useState<'append' | 'replace'>('append')
  const [csvColumn, setCsvColumn] = useState<string>('0')
  const [validation, setValidation] = useState<FileValidation | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, isUploading, progress: uploadProgress, error: uploadError } = useChunkedUpload()
  const importProgress = useImportProgress(jobId)
  const notifications = useNotifications()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setValidation(null)

    // Basic validation
    const errors: string[] = []
    const warnings: string[] = []

    // Check file size
    if (file.size === 0) {
      errors.push('File is empty')
    }

    // Check file type
    const validExtensions = fileFormat === 'csv' ? ['.csv'] : ['.txt', '.text']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!validExtensions.includes(fileExtension)) {
      warnings.push(`File extension "${fileExtension}" doesn't match selected format. Make sure the content matches the format.`)
    }

    // Size warnings
    if (file.size > 50 * 1024 * 1024) { // 50MB
      warnings.push('Large file detected. Upload may take several minutes.')
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    })
  }

  const handleUpload = async () => {
    if (!selectedFile || !validation?.isValid) return

    const endpoint = `/api/admin/surveys/${surveyId}/whitelist/stream-upload`
    
    const additionalFields = {
      format: fileFormat,
      replaceExisting: replaceExisting === 'replace' ? 'true' : 'false',
      ...(fileFormat === 'csv' && { columnIndex: csvColumn })
    }

    try {
      await uploadFile(selectedFile, endpoint, additionalFields)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleCancel = () => {
    if (jobId) {
      // Cancel import job
      fetch(`/api/admin/import-jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    setJobId(null)
    setSelectedFile(null)
    setValidation(null)
    
    onCancel?.()
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s'
    return `${formatBytes(bytesPerSecond)}/s`
  }

  const getOverallProgress = (): number => {
    if (isUploading && uploadProgress) {
      // Upload phase: 0-50%
      return Math.round(uploadProgress.progress / 2)
    } else if (importProgress) {
      // Import phase: 50-100%
      return Math.round(50 + (importProgress.progress / 2))
    }
    return 0
  }

  const getStatusMessage = (): string => {
    if (isUploading) {
      return 'Uploading file...'
    } else if (importProgress) {
      switch (importProgress.status) {
        case 'pending': return 'Preparing import...'
        case 'processing': return 'Processing file...'
        case 'completed': return 'Import completed successfully!'
        case 'failed': return 'Import failed'
        case 'cancelled': return 'Import cancelled'
        default: return 'Processing...'
      }
    }
    return ''
  }

  // Handle upload completion
  React.useEffect(() => {
    if (uploadProgress && !isUploading && !jobId) {
      // Upload completed, extract jobId from result
      // This would come from the server response
      notifications.success('Upload completed', 'File uploaded successfully. Processing started.')
    }
  }, [uploadProgress, isUploading, jobId, notifications])

  // Handle import completion
  React.useEffect(() => {
    if (importProgress?.status === 'completed') {
      notifications.success('Import completed', `Successfully imported ${importProgress.processedItems} items`)
      onComplete?.(importProgress)
    } else if (importProgress?.status === 'failed') {
      notifications.error('Import failed', 'Please check the error details and try again')
    }
  }, [importProgress?.status, notifications, onComplete])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Large File
        </CardTitle>
        <CardDescription>
          Import {type === 'whitelist' ? 'wallet addresses' : 'reward links'} from a large file (up to 100MB)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select File</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".txt,.csv,.text"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatBytes(selectedFile.size)} • {selectedFile.type || 'Text file'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="font-medium">Choose a file to upload</p>
                      <p className="text-sm text-gray-500">
                        TXT or CSV files up to 100MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <Label>File Format</Label>
            <RadioGroup 
              value={fileFormat} 
              onValueChange={(value) => setFileFormat(value as 'txt' | 'csv')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt">Text file (one {type === 'whitelist' ? 'address' : 'link'} per line)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV file (comma-separated values)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* CSV Column Selection */}
          {fileFormat === 'csv' && (
            <div>
              <Label htmlFor="csv-column">CSV Column</Label>
              <Select value={csvColumn} onValueChange={setCsvColumn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select column containing the data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Column 1 (A)</SelectItem>
                  <SelectItem value="1">Column 2 (B)</SelectItem>
                  <SelectItem value="2">Column 3 (C)</SelectItem>
                  <SelectItem value="3">Column 4 (D)</SelectItem>
                  <SelectItem value="4">Column 5 (E)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Import Mode */}
          <div>
            <Label>Import Mode</Label>
            <RadioGroup 
              value={replaceExisting} 
              onValueChange={(value) => setReplaceExisting(value as 'append' | 'replace')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="append" id="append" />
                <Label htmlFor="append">Add to existing data (skip duplicates)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace">Replace all existing data</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Validation Results */}
        {validation && (
          <div className="space-y-2">
            {validation.errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
            
            {validation.warnings.map((warning, index) => (
              <Alert key={index}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {(isUploading || importProgress) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getStatusMessage()}</span>
                <span>{getOverallProgress()}%</span>
              </div>
              <Progress value={getOverallProgress()} className="w-full" />
            </div>

            {/* Upload Details */}
            {isUploading && uploadProgress && (
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Speed: {formatSpeed(uploadProgress.speed)}</div>
                <div>ETA: {formatDuration(uploadProgress.estimatedTimeRemaining)}</div>
                <div>Uploaded: {formatBytes(uploadProgress.uploadedBytes)}</div>
                <div>Total: {formatBytes(uploadProgress.totalBytes)}</div>
              </div>
            )}

            {/* Processing Details */}
            {importProgress && (
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Processed: {importProgress.processedItems.toLocaleString()}</div>
                <div>Total: {importProgress.totalItems.toLocaleString()}</div>
                <div>Speed: {importProgress.speed.toLocaleString()} items/sec</div>
                <div>ETA: {formatDuration(importProgress.estimatedTimeRemaining)}</div>
              </div>
            )}

            {/* Error Display */}
            {importProgress?.errors && importProgress.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Recent Errors:</p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                  {importProgress.errors.slice(-5).map((error, index) => (
                    <div key={index} className="text-xs text-red-700">
                      {error.line && `Line ${error.line}: `}{error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            {isUploading || importProgress ? 'Cancel' : 'Close'}
          </Button>
          
          {!isUploading && !importProgress && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !validation?.isValid}
            >
              Start Import
            </Button>
          )}
          
          {importProgress?.status === 'completed' && (
            <Button onClick={() => onComplete?.(importProgress)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}