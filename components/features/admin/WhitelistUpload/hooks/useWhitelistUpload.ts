import { useState, useRef } from 'react'
import { useNotifications } from '@/components/ui/notifications'
import { WhitelistFileProcessor, ProcessingProgress, FileProcessingResult } from '@/lib/whitelist/WhitelistFileProcessor'
import { WhitelistBatchUploader, UploadProgress } from '@/lib/whitelist/WhitelistBatchUploader'
import { DEFAULT_BATCH_SIZE } from '@/lib/whitelist/constants'
import type { AdminSurveyListItem } from '@/lib/types'

type UploadState = 'idle' | 'processing' | 'ready' | 'uploading' | 'completed' | 'error'

export function useWhitelistUpload(survey: AdminSurveyListItem, onSuccess: () => void) {
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

  const resetState = () => {
    setUploadState('idle')
    setFileProcessingProgress(null)
    setUploadProgress(null)
    setProcessingResult(null)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().match(/\.(txt|csv)$/)) {
        notifications.error('Invalid file type', 'Please select a TXT or CSV file')
        return
      }
      setSelectedFile(file)
      setTextareaAddresses('')
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

  const processData = async () => {
    resetState()
    setUploadState('processing')

    try {
      let result: FileProcessingResult

      if (selectedFile) {
        result = await fileProcessor.processFile(selectedFile, setFileProcessingProgress, batchSize)
      } else {
        result = fileProcessor.processTextInput(textareaAddresses, batchSize)
      }

      setProcessingResult(result)
      setUploadState('ready')

      const { validCount, duplicateCount, invalidCount } = result.stats
      if (validCount === 0) {
        notifications.error('No valid addresses', 'No valid addresses found to upload')
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
      
      const { totalAdded, totalSkipped, totalErrors } = result.summary
      notifications.success(
        'Upload completed',
        `Added ${totalAdded} addresses` +
        (totalSkipped > 0 ? `, skipped ${totalSkipped} duplicates` : '') +
        (totalErrors > 0 ? `, ${totalErrors} errors` : '')
      )

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

  // Computed values
  const hasData = selectedFile || textareaAddresses.trim()
  const canProcess = hasData && uploadState === 'idle'
  const canUpload = uploadState === 'ready' && processingResult
  const isWorking = ['processing', 'uploading'].includes(uploadState)

  return {
    // State
    selectedFile,
    textareaAddresses,
    setTextareaAddresses,
    replaceMode,
    setReplaceMode,
    batchSize,
    setBatchSize,
    uploadState,
    fileProcessingProgress,
    uploadProgress,
    processingResult,
    fileInputRef,
    
    // Computed
    hasData,
    canProcess,
    canUpload,
    isWorking,
    
    // Actions
    handleFileSelect,
    handleRemoveFile,
    handleClearTextarea,
    processData,
    startUpload,
    cancelUpload,
    retryUpload
  }
}