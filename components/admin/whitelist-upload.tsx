'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { uploadWhitelist } from '@/lib/api/admin'
import { useJobProgress } from '@/hooks/use-job-progress'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import {
  Upload,
  FileText,
  X
} from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'

interface WhitelistUploadProps {
  survey: AdminSurveyListItem
  onSuccess: () => void
  onCancel: () => void
}

interface UploadStrategy {
  method: 'sync' | 'async'
  itemCount: number
  message?: string
  jobId?: string
  strategy?: {
    batchSize: number
    description: string
    estimatedTime: string
  }
  validation?: {
    valid: boolean
    warnings: string[]
    errors: string[]
  }
  recommendations?: {
    webSocketRecommended: boolean
    chunkedUploadRecommended: boolean
    memoryWarning: boolean
    tips: string[]
  }
}

interface JobProgress {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  processedItems: number
  totalItems: number
  currentBatch: number
  totalBatches: number
  speed: number
  estimatedTimeRemaining: number
  errors: Array<{
    message: string
    timestamp: string
    line?: number
    value?: string
  }>
}

export function WhitelistUpload({ survey, onSuccess, onCancel }: WhitelistUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textareaAddresses, setTextareaAddresses] = useState('')
  const [replaceMode, setReplaceMode] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadStrategy | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the centralized job progress hook
  const { progress: jobProgress, isConnected, error: wsError } = useJobProgress(activeJobId)

  const notifications = useNotifications()

  // Handle job completion and failures via WebSocket
  useEffect(() => {
    if (!jobProgress) return

    if (jobProgress.status === 'completed') {
      // Job completed successfully
      setActiveJobId(null)
      setUploadResult(null)
      setSelectedFile(null)
      setTextareaAddresses('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setSuccessMessage(`Successfully processed ${jobProgress.processedItems?.toLocaleString() || 'all'} addresses`)
      setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
    }

    if (jobProgress.status === 'failed') {
      notifications.error(
        'Import Failed',
        'The import job encountered an error and could not be completed'
      )
      setActiveJobId(null)
      setUploadResult(null)
    }
  }, [jobProgress?.status, notifications])

  // WebSocket upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { addresses?: string[], file?: File, replaceMode: boolean }) => {
      return await uploadWhitelist(survey.id, data)
    },
    onSuccess: (result) => {
      setUploadResult(result)
      setIsUploading(false)

      // Все загрузки теперь обрабатываются через WebSocket
      if (result.jobId) {
        setActiveJobId(result.jobId)
      }
    },
    onError: (error: any) => {
      setIsUploading(false)
      const errorMessage = error?.data?.message || error.message || 'Upload failed'
      notifications.error('Upload Failed', errorMessage)
    }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Support both .txt and .csv files
      if (!file.name.toLowerCase().match(/\.(txt|csv)$/)) {
        notifications.error('Invalid file type', 'Please select a TXT or CSV file')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClearTextarea = () => {
    setTextareaAddresses('')
  }

  const handleUpload = async () => {
    // Check if we have data to upload
    if (!selectedFile && !textareaAddresses.trim()) {
      notifications.error('No data to upload', 'Please select a file or enter addresses in the text area')
      return
    }


    setIsUploading(true)
    setUploadResult(null)
    setActiveJobId(null)

    try {
      if (selectedFile) {
        // File upload
        await uploadMutation.mutateAsync({
          file: selectedFile,
          replaceMode
        })
      } else {
        // Text area upload
        const addresses = textareaAddresses
          .split('\n')
          .map(addr => addr.trim())
          .filter(addr => addr.length > 0)

        // Basic validation
        const invalidAddresses = addresses.filter(addr =>
          !addr.match(/^0x[a-fA-F0-9]{40}$/i)
        )

        if (invalidAddresses.length > 0) {
          notifications.error(
            'Invalid addresses found',
            `Found ${invalidAddresses.length} invalid address(es). Please check the format.`
          )
          setIsUploading(false)
          return
        }

        await uploadMutation.mutateAsync({
          addresses,
          replaceMode
        })
      }
    } catch (error) {
      // Error handling is done in the mutation
      setIsUploading(false)
    }
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
                    disabled={isUploading || textareaAddresses.trim().length > 0}
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
                      disabled={isUploading}
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
                  disabled={isUploading || !!selectedFile}
                  className="resize-none font-mono text-sm h-40"
                />
                {textareaAddresses.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearTextarea}
                    disabled={isUploading || !!selectedFile}
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

          {/* Replace/Append Mode Toggle */}
          {(selectedFile || textareaAddresses.trim()) && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Switch
                id="replace-mode"
                checked={replaceMode}
                onCheckedChange={setReplaceMode}
                disabled={isUploading}
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
          )}
        </CardContent>
      </Card>


      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isUploading || !!activeJobId}
          >
            {activeJobId ? 'Processing...' : 'Cancel'}
          </Button>

          <Button
            onClick={handleUpload}
            disabled={(!selectedFile && !textareaAddresses.trim()) || isUploading || !!activeJobId}
          >
            {isUploading ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Analyzing...' : 'Upload & Process'}
          </Button>
        </div>

        {/* Progress bar under buttons */}
        {activeJobId && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: jobProgress?.progress ? `${jobProgress.progress}%` : '0%',
                  ...((!jobProgress?.progress) && { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' })
                }}
              />
            </div>
            <div className="text-center text-sm font-medium text-gray-900">
              {wsError ? (
                <span className="text-red-600">Connection error: {wsError}</span>
              ) : jobProgress?.processedItems && jobProgress?.totalItems ? (
                `${jobProgress.processedItems.toLocaleString()} / ${jobProgress.totalItems.toLocaleString()} addresses`
              ) : isConnected ? (
                'Processing...'
              ) : (
                'Connecting to WebSocket...'
              )}
            </div>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="text-center text-sm font-medium text-green-600 bg-green-50 p-2 rounded">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  )
}
