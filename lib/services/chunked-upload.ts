interface ChunkedUploadOptions {
  chunkSize: number // bytes
  maxRetries: number
  retryDelay: number // ms
  onProgress: (progress: UploadProgress) => void
  onError: (error: UploadError) => void
  onComplete: (result: UploadResult) => void
}

interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  uploadedChunks: number
  totalChunks: number
  progress: number // 0-100
  speed: number // bytes per second
  estimatedTimeRemaining: number // seconds
}

interface UploadError {
  chunkIndex: number
  error: string
  retryCount: number
}

interface UploadResult {
  jobId: string
  status: string
  totalItems: number
}

export class ChunkedUploadService {
  private readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
  private readonly DEFAULT_MAX_RETRIES = 3
  private readonly DEFAULT_RETRY_DELAY = 1000 // 1 second

  private options: ChunkedUploadOptions
  private uploadStartTime: number = 0
  private uploadedBytes: number = 0
  private abortController?: AbortController

  constructor(options: Partial<ChunkedUploadOptions> = {}) {
    this.options = {
      chunkSize: options.chunkSize || this.DEFAULT_CHUNK_SIZE,
      maxRetries: options.maxRetries || this.DEFAULT_MAX_RETRIES,
      retryDelay: options.retryDelay || this.DEFAULT_RETRY_DELAY,
      onProgress: options.onProgress || (() => {}),
      onError: options.onError || (() => {}),
      onComplete: options.onComplete || (() => {}),
    }
  }

  /**
   * Upload a large file using chunked upload
   */
  async uploadFile(
    file: File,
    endpoint: string,
    additionalFields: Record<string, string> = {}
  ): Promise<void> {
    this.uploadStartTime = Date.now()
    this.uploadedBytes = 0
    this.abortController = new AbortController()

    const totalChunks = Math.ceil(file.size / this.options.chunkSize)
    let uploadedChunks = 0

    try {
      // For small files, use regular upload
      if (file.size <= this.options.chunkSize) {
        await this.uploadSingleFile(file, endpoint, additionalFields)
        return
      }

      // For large files, use chunked upload
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (this.abortController.signal.aborted) {
          throw new Error('Upload cancelled')
        }

        const start = chunkIndex * this.options.chunkSize
        const end = Math.min(start + this.options.chunkSize, file.size)
        const chunk = file.slice(start, end)

        await this.uploadChunkWithRetry(chunk, chunkIndex, totalChunks, endpoint, additionalFields)
        
        uploadedChunks++
        this.uploadedBytes += chunk.size

        // Calculate and report progress
        this.reportProgress(file.size, uploadedChunks, totalChunks)
      }

      // All chunks uploaded successfully - the server should combine them
      // Wait for server processing to complete
      await this.waitForServerProcessing(endpoint)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      this.options.onError({
        chunkIndex: -1,
        error: errorMessage,
        retryCount: 0
      })
      throw error
    }
  }

  /**
   * Cancel the current upload
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  private async uploadSingleFile(
    file: File,
    endpoint: string,
    additionalFields: Record<string, string>
  ): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    
    // Add additional fields
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: this.abortController?.signal
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Upload failed')
    }

    this.options.onComplete(result.data)
  }

  private async uploadChunkWithRetry(
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    endpoint: string,
    additionalFields: Record<string, string>
  ): Promise<void> {
    let retryCount = 0

    while (retryCount <= this.options.maxRetries) {
      try {
        await this.uploadChunk(chunk, chunkIndex, totalChunks, endpoint, additionalFields)
        return // Success
      } catch (error) {
        retryCount++
        
        if (retryCount > this.options.maxRetries) {
          this.options.onError({
            chunkIndex,
            error: error instanceof Error ? error.message : 'Chunk upload failed',
            retryCount
          })
          throw error
        }

        // Wait before retry
        await this.delay(this.options.retryDelay * retryCount)
      }
    }
  }

  private async uploadChunk(
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    endpoint: string,
    additionalFields: Record<string, string>
  ): Promise<void> {
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('chunkIndex', chunkIndex.toString())
    formData.append('totalChunks', totalChunks.toString())
    
    // Add additional fields only to the first chunk
    if (chunkIndex === 0) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const response = await fetch(`${endpoint}/chunk`, {
      method: 'POST',
      body: formData,
      signal: this.abortController?.signal
    })

    if (!response.ok) {
      throw new Error(`Chunk ${chunkIndex} upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || `Chunk ${chunkIndex} upload failed`)
    }

    // If this is the last chunk, save the result
    if (chunkIndex === totalChunks - 1 && result.data) {
      this.options.onComplete(result.data)
    }
  }

  private reportProgress(totalBytes: number, uploadedChunks: number, totalChunks: number): void {
    const now = Date.now()
    const elapsed = (now - this.uploadStartTime) / 1000 // seconds
    const speed = elapsed > 0 ? this.uploadedBytes / elapsed : 0
    const remainingBytes = totalBytes - this.uploadedBytes
    const estimatedTimeRemaining = speed > 0 ? remainingBytes / speed : 0

    const progress: UploadProgress = {
      uploadedBytes: this.uploadedBytes,
      totalBytes,
      uploadedChunks,
      totalChunks,
      progress: Math.round((this.uploadedBytes / totalBytes) * 100),
      speed: Math.round(speed),
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining)
    }

    this.options.onProgress(progress)
  }

  private async waitForServerProcessing(endpoint: string): Promise<void> {
    // This is a simplified version - in reality you'd poll the server
    // or use WebSocket to get processing status
    await this.delay(1000) // Give server time to start processing
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

import React from 'react'

/**
 * Hook for using chunked upload in React components
 */
export function useChunkedUpload() {
  const [isUploading, setIsUploading] = React.useState(false)
  const [progress, setProgress] = React.useState<UploadProgress | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<UploadResult | null>(null)

  const uploadFile = async (
    file: File,
    endpoint: string,
    additionalFields: Record<string, string> = {}
  ) => {
    setIsUploading(true)
    setError(null)
    setResult(null)
    setProgress(null)

    const uploader = new ChunkedUploadService({
      onProgress: (progress) => {
        setProgress(progress)
      },
      onError: (error) => {
        setError(error.error)
        setIsUploading(false)
      },
      onComplete: (result) => {
        setResult(result)
        setIsUploading(false)
      }
    })

    try {
      await uploader.uploadFile(file, endpoint, additionalFields)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setIsUploading(false)
    }
  }

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    result
  }
}