'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { smartUploadWhitelist, getSmartUploadStatus } from '@/lib/api/admin'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import { useNotifications } from '@/components/ui/notifications'
import { 
  Upload, 
  FileText,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Activity,
  TrendingUp
} from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'

interface SmartWhitelistUploadProps {
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

export function SmartWhitelistUpload({ survey, onSuccess, onCancel }: SmartWhitelistUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textareaAddresses, setTextareaAddresses] = useState('')
  const [replaceMode, setReplaceMode] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadStrategy | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const notifications = useNotifications()
  const queryClient = useQueryClient()

  // Poll job progress if we have an active job
  const { data: jobProgress } = useQuery({
    queryKey: ['smart-upload-progress', activeJobId],
    queryFn: () => activeJobId ? getSmartUploadStatus(activeJobId) : null,
    enabled: !!activeJobId && uploadResult?.method === 'async',
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        return false
      }
      return 2000 // Poll every 2 seconds for active jobs
    }
  })

  // Handle job completion
  useEffect(() => {
    if (jobProgress?.status === 'completed') {
      notifications.success(
        'Import Complete!', 
        `Successfully processed ${jobProgress.processedItems} addresses`
      )
      setActiveJobId(null)
      setUploadResult(null)
      onSuccess()
    } else if (jobProgress?.status === 'failed') {
      notifications.error(
        'Import Failed', 
        'The import job encountered an error and could not be completed'
      )
      setActiveJobId(null)
      setUploadResult(null)
    }
  }, [jobProgress?.status, notifications, onSuccess])

  // Smart upload mutation
  const smartUploadMutation = useMutation({
    mutationFn: async (data: { addresses?: string[], file?: File, replaceMode: boolean }) => {
      return await smartUploadWhitelist(survey.id, data)
    },
    onSuccess: (result) => {
      setUploadResult(result)
      setIsUploading(false)

      if (result.method === 'sync') {
        // Synchronous processing completed immediately
        notifications.success(
          'Import Complete!',
          `${result.message} (${result.processingTime}ms)`
        )
        onSuccess()
      } else if (result.method === 'async') {
        // Asynchronous processing started
        if (result.jobId) {
          setActiveJobId(result.jobId)
          notifications.info(
            'Import Started',
            result.message
          )
        }
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
        await smartUploadMutation.mutateAsync({
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

        await smartUploadMutation.mutateAsync({
          addresses,
          replaceMode
        })
      }
    } catch (error) {
      // Error handling is done in the mutation
      setIsUploading(false)
    }
  }

  const getMethodIcon = (method: 'sync' | 'async') => {
    return method === 'sync' ? <Zap className="w-4 h-4" /> : <Activity className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600' 
      case 'cancelled': return 'text-gray-600'
      case 'processing': return 'text-blue-600'
      default: return 'text-yellow-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Smart Whitelist Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Upload File (.txt or .csv - one address per line)
            </label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Select a file to import wallet addresses</p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
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

          {/* OR Divider */}
          <div className="flex items-center gap-4">
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
                placeholder="0x1234567890123456789012345678901234567890&#10;0x0987654321098765432109876543210987654321&#10;0x..."
                rows={6}
                disabled={isUploading}
                className="resize-none font-mono text-sm"
              />
              {textareaAddresses.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearTextarea}
                  disabled={isUploading}
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

      {/* Upload Strategy Information */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getMethodIcon(uploadResult.method)}
              Processing Strategy: {uploadResult?.method === 'sync' ? 'Synchronous' : 'Asynchronous'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message for async processing */}
            {uploadResult.method === 'async' && uploadResult.message && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{uploadResult.message}</p>
                {uploadResult.jobId && (
                  <p className="text-xs text-blue-600 mt-2">Job ID: {uploadResult.jobId}</p>
                )}
              </div>
            )}

            {/* Strategy Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadResult.itemCount?.toLocaleString() || 'N/A'}</div>
                <div className="text-sm text-gray-600">Addresses</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResult.strategy?.batchSize?.toLocaleString() || 'Processing'}</div>
                <div className="text-sm text-gray-600">Batch Size</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{uploadResult.strategy?.estimatedTime || 'Calculating...'}</div>
                <div className="text-sm text-gray-600">Est. Time</div>
              </div>
            </div>

            {/* Validation Status */}
            {uploadResult.validation && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  {uploadResult.validation.valid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  Validation Status
                </h4>
                
                {uploadResult.validation.errors?.length > 0 && (
                  <div className="space-y-1">
                    {uploadResult.validation.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                {uploadResult.validation.warnings?.length > 0 && (
                  <div className="space-y-1">
                    {uploadResult.validation.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {uploadResult.recommendations?.tips && uploadResult.recommendations.tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Recommendations
                </h4>
                <div className="space-y-1">
                  {uploadResult.recommendations?.tips?.map((tip, index) => (
                    <div key={index} className="text-sm text-blue-600 bg-blue-50 p-2 rounded flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Progress (for async jobs) */}
      {activeJobId && jobProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Processing Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {jobProgress.progress}%</span>
                <span className={getStatusColor(jobProgress.status)}>
                  {jobProgress.status.toUpperCase()}
                </span>
              </div>
              <Progress value={jobProgress.progress} className="w-full" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{jobProgress.processedItems.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Processed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{jobProgress.totalItems.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{jobProgress.speed.toLocaleString()}/s</div>
                <div className="text-xs text-gray-600">Speed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">
                  {jobProgress.estimatedTimeRemaining > 60 
                    ? `${Math.ceil(jobProgress.estimatedTimeRemaining / 60)}m`
                    : `${jobProgress.estimatedTimeRemaining}s`
                  }
                </div>
                <div className="text-xs text-gray-600">ETA</div>
              </div>
            </div>

            {/* Batch Progress */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Batch {jobProgress.currentBatch} of {jobProgress.totalBatches}</span>
              <span>{((jobProgress.currentBatch / jobProgress.totalBatches) * 100).toFixed(1)}% batches complete</span>
            </div>

            {/* Recent Errors */}
            {jobProgress.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Recent Errors ({jobProgress.errors.length})</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {jobProgress.errors.slice(-5).map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error.line && <span className="font-mono">Line {error.line}: </span>}
                      {error.message}
                    </div>
                  ))}
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
    </div>
  )
}