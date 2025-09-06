'use client'

import { Button } from '@/components/ui/button'
import { FileText, Upload } from 'lucide-react'
import type { AdminSurveyListItem } from '@/lib/types'
import { WhitelistUploadProgress } from '@/components/admin/whitelist/WhitelistUploadProgress'
import { useWhitelistUpload } from './hooks/useWhitelistUpload'
import { FileUploadSection } from './FileUploadSection'
import { UploadSettings } from './UploadSettings'
import { ProcessingResults } from './ProcessingResults'

interface WhitelistUploadProps {
  survey: AdminSurveyListItem
  onSuccess: () => void
  onCancel: () => void
}

export function WhitelistUpload({ survey, onSuccess, onCancel }: WhitelistUploadProps) {
  const {
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
    hasData,
    canProcess,
    canUpload,
    isWorking,
    handleFileSelect,
    handleRemoveFile,
    handleClearTextarea,
    processData,
    startUpload,
    cancelUpload,
    retryUpload
  } = useWhitelistUpload(survey, onSuccess)

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
      <FileUploadSection
        selectedFile={selectedFile}
        textareaAddresses={textareaAddresses}
        onTextareaChange={setTextareaAddresses}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onClearTextarea={handleClearTextarea}
        isWorking={isWorking}
        fileInputRef={fileInputRef}
      />

      <UploadSettings
        replaceMode={replaceMode}
        onReplaceModeChange={setReplaceMode}
        batchSize={batchSize}
        onBatchSizeChange={setBatchSize}
        isWorking={isWorking}
        hasData={!!hasData}
      />

      <ProcessingResults
        processingResult={processingResult}
        uploadState={uploadState}
      />

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