'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications } from '@/components/ui/notifications'
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'
import { WhitelistFileProcessor, ProcessingProgress, FileProcessingResult } from '@/lib/whitelist/WhitelistFileProcessor'
import { WhitelistBatchUploader, UploadProgress } from '@/lib/whitelist/WhitelistBatchUploader'
import { WhitelistUploadProgress } from './whitelist/WhitelistUploadProgress'
import { DEFAULT_BATCH_SIZE, MIN_BATCH_SIZE, MAX_BATCH_SIZE, BATCH_SIZE_STEP } from '@/lib/whitelist/constants'

interface WhitelistUploadProps {
  survey: AdminSurveyListItem
  onSuccess: () => void
  onCancel: () => void
}

type UploadState = 'idle' | 'processing' | 'ready' | 'uploading' | 'completed' | 'error'

export function WhitelistUpload({ survey, onSuccess, onCancel }: WhitelistUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textareaAddresses, setTextareaAddresses] = useState('')
  const [replaceMode, setReplaceMode] = useState(false)
  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  
  // Processing and upload progress
  const [fileProcessingProgress, setFileProcessingProgress] = useState<ProcessingProgress | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [processingResult, setProcessingResult] = useState<FileProcessingResult | null>(null)

  // Services
  const fileProcessor = new WhitelistFileProcessor()
  const batchUploader = useRef<WhitelistBatchUploader | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const notifications = useNotifications()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().match(/\.(txt|csv)$/)) {
        notifications.error('Invalid file type', 'Please select a TXT or CSV file')
        return
      }
      setSelectedFile(file)
      setTextareaAddresses('') // Clear textarea when file is selected
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    resetState()
  }

  const handleClearTextarea = () => {
    setTextareaAddresses('')
    resetState()
  }

  const resetState = () => {
    setUploadState('idle')
    setFileProcessingProgress(null)
    setUploadProgress(null)
    setProcessingResult(null)
  }

  const processData = async () => {
    resetState()
    setUploadState('processing')

    try {
      let result: FileProcessingResult

      if (selectedFile) {
        // Process file
        result = await fileProcessor.processFile(selectedFile, setFileProcessingProgress, batchSize)
      } else {
        // Process textarea input
        result = fileProcessor.processTextInput(textareaAddresses, batchSize)
      }

      setProcessingResult(result)
      setUploadState('ready')

      // Show summary notification
      const { validCount, duplicateCount, invalidCount } = result.stats
      if (validCount === 0) {
        notifications.error('No valid addresses', 'No valid Ethereum addresses found to upload')
        setUploadState('error')
        return
      }

      notifications.success(
        'File processed',
        `Found ${validCount} valid addresses` +
        (duplicateCount > 0 ? `, ${duplicateCount} duplicates removed` : '') +
        (invalidCount > 0 ? `, ${invalidCount} invalid addresses` : '')
      )
    } catch (error: any) {
      console.error('Processing error:', error)
      notifications.error('Processing failed', error.message || 'Failed to process addresses')
      setUploadState('error')
    }
  }

  const startUpload = async () => {
    if (!processingResult || processingResult.validAddresses.length === 0) {
      notifications.error('No addresses to upload', 'Please process addresses first')
      return
    }

    if (uploadState === 'uploading') {
      console.warn('[WhitelistUpload] Upload already in progress, ignoring duplicate request')
      return
    }

    console.log('[WhitelistUpload] Starting upload with batch size:', batchSize)
    setUploadState('uploading')
    batchUploader.current = new WhitelistBatchUploader()

    try {
      const result = await batchUploader.current.uploadAddresses(
        survey.id,
        processingResult.validAddresses,
        replaceMode,
        setUploadProgress,
        batchSize
      )

      setUploadState('completed')
      
      // Show success notification
      const { totalAdded, totalSkipped, totalErrors } = result.summary
      notifications.success(
        'Upload completed',
        `Added ${totalAdded} addresses` +
        (totalSkipped > 0 ? `, skipped ${totalSkipped} duplicates` : '') +
        (totalErrors > 0 ? `, ${totalErrors} errors` : '')
      )

      // Clear form after short delay
      setTimeout(() => {
        setSelectedFile(null)
        setTextareaAddresses('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        resetState()
        onSuccess()
      }, 2000)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadState('error')
      notifications.error('Upload failed', error.message || 'Failed to upload addresses')
    }
  }

  const cancelUpload = () => {
    if (batchUploader.current) {
      batchUploader.current.cancel()
    }
    resetState()
  }

  const retryUpload = () => {
    if (processingResult) {
      startUpload()
    }
  }

  const hasData = selectedFile || textareaAddresses.trim()
  const canProcess = hasData && uploadState === 'idle'
  const canUpload = uploadState === 'ready' && processingResult
  const isWorking = ['processing', 'uploading'].includes(uploadState)

  // Show progress if processing or uploading
  if (['processing', 'uploading', 'completed', 'error'].includes(uploadState)) {
    return (
      <div className="space-y-6">
        <WhitelistUploadProgress
          fileProcessingProgress={uploadState === 'processing' ? fileProcessingProgress || undefined : undefined}
          uploadProgress={['uploading', 'completed', 'error'].includes(uploadState) ? uploadProgress || undefined : undefined}
          onCancel={uploadState === 'uploading' ? cancelUpload : undefined}
          onRetry={uploadState === 'error' && processingResult ? retryUpload : undefined}
          onClose={['completed', 'error'].includes(uploadState) ? onCancel : undefined}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Whitelist Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload and Textarea Side by Side */}
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
                      onClick={handleRemoveFile}
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
                onChange={handleFileSelect}
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
                  onChange={(e) => setTextareaAddresses(e.target.value)}
                  placeholder={`0x1234567890123456789012345678901234567890\n0x0987654321098765432109876543210987654321\n0x...`}
                  rows={6}
                  disabled={isWorking || !!selectedFile}
                  className="resize-none font-mono text-sm h-40"
                />
                {textareaAddresses.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearTextarea}
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

          {/* Replace/Append Mode Toggle & Batch Size */}
          {hasData && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Switch
                  id="replace-mode"
                  checked={replaceMode}
                  onCheckedChange={setReplaceMode}
                  disabled={isWorking}
                />
                <div className="flex-1">
                  <Label htmlFor="replace-mode" className="text-sm font-medium">
                    {replaceMode ? 'Replace existing whitelist' : 'Add to existing whitelist'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {replaceMode
                      ? 'All current addresses will be removed and replaced with imported ones'
                      : 'New addresses will be added to the existing whitelist (duplicates will be skipped)'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="batch-size" className="text-sm font-medium text-gray-700">
                    Batch Size: {batchSize} addresses
                  </Label>
                  <p className="text-xs text-gray-600">
                    Larger batches = faster upload, smaller batches = more stable ({MIN_BATCH_SIZE}-{MAX_BATCH_SIZE})
                  </p>
                </div>
                <div className="w-24">
                  <input
                    id="batch-size"
                    type="number"
                    min={MIN_BATCH_SIZE}
                    max={MAX_BATCH_SIZE}
                    step={BATCH_SIZE_STEP}
                    value={batchSize}
                    onChange={(e) => {
                      const value = Math.max(MIN_BATCH_SIZE, Math.min(MAX_BATCH_SIZE, Number(e.target.value) || MIN_BATCH_SIZE))
                      setBatchSize(value)
                    }}
                    disabled={isWorking}
                    className="w-full px-3 py-1 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Results Preview */}
      {uploadState === 'ready' && processingResult && (
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
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isWorking}
        >
          Cancel
        </Button>

        {canProcess && (
          <Button onClick={processData}>
            <FileText className="w-4 h-4 mr-2" />
            Process Addresses
          </Button>
        )}

        {canUpload && (
          <Button onClick={startUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Whitelist
          </Button>
        )}
      </div>
    </div>
  )
}