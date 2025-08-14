/**
 * Batch uploader for whitelist addresses
 * Manages upload sessions and handles parallel batch processing
 */

import { createUploadSession, uploadAddressBatch, completeUploadSession } from '../api/admin'
import { DEFAULT_BATCH_SIZE, MIN_BATCH_SIZE, MAX_BATCH_SIZE } from './constants'

export interface UploadSession {
  sessionId: string
  surveyId: string
  totalAddresses: number
  processedAddresses: number
  totalBatches: number
  completedBatches: number
  replaceMode: boolean
  createdAt: Date
  status: 'active' | 'completed' | 'failed' | 'cancelled'
}

export interface BatchUploadResult {
  batchIndex: number
  added: number
  skipped: number
  errors: Array<{
    value?: string
    message: string
    timestamp: Date
  }>
}

export interface UploadProgress {
  stage: 'creating_session' | 'uploading' | 'completing' | 'completed' | 'error'
  totalAddresses: number
  processedAddresses: number
  currentBatch: number
  totalBatches: number
  progress: number // 0-100
  speed: string // addresses per second
  eta: string // estimated time remaining
  errors: Array<{
    batchIndex: number
    message: string
    addresses?: string[]
  }>
  session?: UploadSession
}

export class WhitelistBatchUploader {
  private readonly MAX_RETRIES = 3
  
  private batchSize: number = DEFAULT_BATCH_SIZE

  private session: UploadSession | null = null
  private startTime: Date | null = null
  private onProgressCallback?: (progress: UploadProgress) => void
  private cancelled = false

  /**
   * Set batch size for uploads
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(MIN_BATCH_SIZE, Math.min(MAX_BATCH_SIZE, size))
  }

  /**
   * Get current batch size
   */
  getBatchSize(): number {
    return this.batchSize
  }

  /**
   * Upload addresses in batches with progress tracking
   */
  async uploadAddresses(
    surveyId: string,
    addresses: string[],
    replaceMode: boolean = false,
    onProgress?: (progress: UploadProgress) => void,
    batchSize?: number
  ): Promise<{
    session: UploadSession
    results: BatchUploadResult[]
    summary: {
      totalProcessed: number
      totalAdded: number
      totalSkipped: number
      totalErrors: number
    }
  }> {
    this.onProgressCallback = onProgress
    this.cancelled = false
    this.startTime = new Date()
    
    // Set batch size if provided
    if (batchSize) {
      this.setBatchSize(batchSize)
    }

    try {
      // Step 1: Create upload session
      this.reportProgress({
        stage: 'creating_session',
        totalAddresses: addresses.length,
        processedAddresses: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(addresses.length / this.batchSize),
        progress: 0,
        speed: '0 адр/сек',
        eta: 'Подсчет...',
        errors: []
      })

      this.session = await this.createUploadSession(surveyId, addresses.length, replaceMode, this.batchSize)

      // Step 2: Split into batches and upload
      const batches = this.createBatches(addresses)
      const results: BatchUploadResult[] = []
      let processedAddresses = 0

      this.reportProgress({
        stage: 'uploading',
        totalAddresses: addresses.length,
        processedAddresses: 0,
        currentBatch: 0,
        totalBatches: batches.length,
        progress: 0,
        speed: '0 адр/сек',
        eta: this.estimateTimeRemaining(0, addresses.length),
        errors: [],
        session: this.session
      })

      // Upload batches sequentially to avoid race conditions
      for (let i = 0; i < batches.length; i++) {
        if (this.cancelled) {
          throw new Error('Загрузка отменена пользователем')
        }

        console.log(`[WhitelistBatchUploader] Starting batch ${i + 1}/${batches.length} (${batches[i].length} addresses)`)

        try {
          const result = await this.uploadBatchWithRetry(
            surveyId, 
            this.session!.sessionId, 
            batches[i], 
            i
          )
          
          console.log(`[WhitelistBatchUploader] Batch ${i + 1} completed successfully:`, { added: result.added, skipped: result.skipped, errors: result.errors.length })
          
          results.push(result)
          processedAddresses += batches[i].length
        } catch (error: any) {
          console.error(`[WhitelistBatchUploader] Batch ${i + 1} failed:`, error)
          // Handle failed batch
          results.push({
            batchIndex: i,
            added: 0,
            skipped: 0,
            errors: [{
              message: `Ошибка загрузки батча: ${error.message}`,
              timestamp: new Date()
            }]
          })
        }

        // Update progress after each batch
        const progress = Math.round((processedAddresses / addresses.length) * 100)
        const currentErrors = results
          .filter(r => r.errors.length > 0)
          .map((r) => ({
            batchIndex: r.batchIndex,
            message: r.errors[0]?.message || 'Неизвестная ошибка',
            addresses: batches[r.batchIndex]?.slice(0, 5) // First 5 addresses for context
          }))

        this.reportProgress({
          stage: 'uploading',
          totalAddresses: addresses.length,
          processedAddresses,
          currentBatch: i + 1,
          totalBatches: batches.length,
          progress,
          speed: this.calculateSpeed(processedAddresses),
          eta: this.estimateTimeRemaining(processedAddresses, addresses.length),
          errors: currentErrors,
          session: this.session
        })
      }

      // Step 3: Complete session
      this.reportProgress({
        stage: 'completing',
        totalAddresses: addresses.length,
        processedAddresses,
        currentBatch: batches.length,
        totalBatches: batches.length,
        progress: 95,
        speed: this.calculateSpeed(processedAddresses),
        eta: 'Завершение...',
        errors: [],
        session: this.session
      })

      await this.completeUploadSession(surveyId, this.session.sessionId)

      // Calculate summary
      const summary = {
        totalProcessed: processedAddresses,
        totalAdded: results.reduce((sum, r) => sum + r.added, 0),
        totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0)
      }

      this.reportProgress({
        stage: 'completed',
        totalAddresses: addresses.length,
        processedAddresses,
        currentBatch: batches.length,
        totalBatches: batches.length,
        progress: 100,
        speed: this.calculateSpeed(processedAddresses),
        eta: 'Завершено',
        errors: [],
        session: { ...this.session, status: 'completed' }
      })

      return { session: this.session, results, summary }

    } catch (error: any) {
      this.reportProgress({
        stage: 'error',
        totalAddresses: addresses.length,
        processedAddresses: 0,
        currentBatch: 0,
        totalBatches: 0,
        progress: 0,
        speed: '0 адр/сек',
        eta: 'Ошибка',
        errors: [{
          batchIndex: -1,
          message: error.message || 'Неизвестная ошибка загрузки'
        }],
        session: this.session || undefined
      })
      throw error
    }
  }

  /**
   * Cancel current upload
   */
  cancel(): void {
    this.cancelled = true
  }

  private async createUploadSession(
    surveyId: string, 
    totalAddresses: number, 
    replaceMode: boolean,
    batchSize: number
  ): Promise<UploadSession> {
    const totalBatches = Math.ceil(totalAddresses / batchSize)
    const response = await createUploadSession(surveyId, totalAddresses, replaceMode, batchSize)
    return {
      sessionId: response.sessionId,
      surveyId: response.surveyId,
      totalAddresses: response.totalAddresses,
      processedAddresses: response.processedAddresses,
      totalBatches: response.totalBatches,
      completedBatches: response.completedBatches,
      replaceMode: response.replaceMode,
      createdAt: new Date(response.createdAt),
      status: response.status
    }
  }

  private async completeUploadSession(surveyId: string, sessionId: string): Promise<void> {
    await completeUploadSession(surveyId, sessionId)
  }

  private createBatches(addresses: string[]): string[][] {
    const batches: string[][] = []
    for (let i = 0; i < addresses.length; i += this.batchSize) {
      batches.push(addresses.slice(i, i + this.batchSize))
    }
    return batches
  }

  private async uploadBatchWithRetry(
    surveyId: string,
    sessionId: string,
    addresses: string[],
    batchIndex: number,
    attempt: number = 1
  ): Promise<BatchUploadResult> {
    try {
      console.log(`[WhitelistBatchUploader] API call for batch ${batchIndex}, attempt ${attempt}`)
      const response = await uploadAddressBatch(surveyId, sessionId, batchIndex, addresses)
      console.log(`[WhitelistBatchUploader] API response for batch ${batchIndex}:`, response)

      return {
        batchIndex,
        added: response.added,
        skipped: response.skipped,
        errors: response.errors.map(e => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }))
      }
    } catch (error: any) {
      console.error(`[WhitelistBatchUploader] Batch ${batchIndex} attempt ${attempt} failed:`, {
        fullError: error,
        message: error.message,
        name: error.name,
        status: error.response?.status || error.status,
        data: error.response?.data || error.data,
        stack: error.stack,
        code: error.code,
        isAxiosError: error.isAxiosError
      })
      
      if (attempt < this.MAX_RETRIES) {
        console.log(`[WhitelistBatchUploader] Retrying batch ${batchIndex} in ${Math.pow(2, attempt)} seconds...`)
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        return this.uploadBatchWithRetry(surveyId, sessionId, addresses, batchIndex, attempt + 1)
      }
      throw error
    }
  }

  private reportProgress(progress: UploadProgress): void {
    this.onProgressCallback?.(progress)
  }

  private calculateSpeed(processedAddresses: number): string {
    if (!this.startTime || processedAddresses === 0) {
      return '0 адр/сек'
    }

    const elapsedSeconds = (new Date().getTime() - this.startTime.getTime()) / 1000
    const addressesPerSecond = Math.round(processedAddresses / elapsedSeconds)
    
    return `${addressesPerSecond} адр/сек`
  }

  private estimateTimeRemaining(processedAddresses: number, totalAddresses: number): string {
    if (!this.startTime || processedAddresses === 0) {
      return 'Подсчет...'
    }

    const elapsedSeconds = (new Date().getTime() - this.startTime.getTime()) / 1000
    const addressesPerSecond = processedAddresses / elapsedSeconds
    const remainingAddresses = totalAddresses - processedAddresses
    const estimatedSeconds = Math.ceil(remainingAddresses / addressesPerSecond)

    if (estimatedSeconds < 60) {
      return `~${estimatedSeconds} сек`
    } else if (estimatedSeconds < 3600) {
      return `~${Math.ceil(estimatedSeconds / 60)} мин`
    } else {
      const hours = Math.floor(estimatedSeconds / 3600)
      const minutes = Math.ceil((estimatedSeconds % 3600) / 60)
      return `~${hours}ч ${minutes}м`
    }
  }
}