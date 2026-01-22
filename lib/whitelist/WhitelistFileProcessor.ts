/**
 * Client-side file processing for whitelist uploads
 * Handles large files by reading in chunks and validating addresses
 */

import { DEFAULT_BATCH_SIZE } from './constants'

export interface FileProcessingResult {
  validAddresses: string[]
  duplicates: string[]
  invalidAddresses: Array<{
    value: string
    line: number
    error: string
  }>
  stats: {
    totalLines: number
    validCount: number
    duplicateCount: number
    invalidCount: number
    estimatedUploadTime: string
  }
}

export interface ProcessingProgress {
  stage: 'reading' | 'parsing' | 'validating' | 'deduplicating' | 'complete'
  progress: number // 0-100
  currentLine: number
  totalLines?: number
  message: string
}

export class WhitelistFileProcessor {
  private readonly CHUNK_SIZE = 1024 * 1024 // 1MB chunks
  private readonly ADDRESS_REGEX = /.+/ // Accept any non-empty string

  /**
   * Process file in chunks for large files
   */
  async processFile(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void,
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<FileProcessingResult> {
    const addresses = new Set<string>()
    const duplicates = new Set<string>()
    const invalidAddresses: Array<{ value: string; line: number; error: string }> = []

    let currentLine = 0
    let processedBytes = 0
    const totalBytes = file.size

    onProgress?.({
      stage: 'reading',
      progress: 0,
      currentLine: 0,
      message: 'Начинаю чтение файла...'
    })

    // Read file in chunks
    let buffer = ''

    for (let offset = 0; offset < file.size; offset += this.CHUNK_SIZE) {
      const chunk = file.slice(offset, offset + this.CHUNK_SIZE)
      const chunkText = await this.readChunk(chunk)
      buffer += chunkText
      processedBytes += chunk.size

      // Process complete lines
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line for next chunk

      for (let i = 0; i < lines.length; i++) {
        currentLine++
        const line = lines[i].trim()

        if (!line) continue // Skip empty lines

        const normalizedAddress = line.toLowerCase()

        if (!this.isValidAddress(normalizedAddress)) {
          invalidAddresses.push({
            value: line,
            line: currentLine,
            error: 'Некорректный формат адреса'
          })
          continue
        }

        if (addresses.has(normalizedAddress)) {
          duplicates.add(normalizedAddress)
        } else {
          addresses.add(normalizedAddress)
        }
      }

      // Update progress
      const progress = Math.round((processedBytes / totalBytes) * 70) // 70% for reading
      onProgress?.({
        stage: 'parsing',
        progress,
        currentLine,
        totalLines: Math.round(currentLine * (totalBytes / processedBytes)),
        message: `Обработано ${currentLine} строк...`
      })
    }

    // Process final buffer
    if (buffer.trim()) {
      currentLine++
      const normalizedAddress = buffer.trim().toLowerCase()

      if (this.isValidAddress(normalizedAddress)) {
        if (addresses.has(normalizedAddress)) {
          duplicates.add(normalizedAddress)
        } else {
          addresses.add(normalizedAddress)
        }
      } else {
        invalidAddresses.push({
          value: buffer.trim(),
          line: currentLine,
          error: 'Некорректный формат адреса'
        })
      }
    }

    onProgress?.({
      stage: 'deduplicating',
      progress: 85,
      currentLine,
      totalLines: currentLine,
      message: 'Финальная обработка...'
    })

    const validAddresses = Array.from(addresses)
    const duplicateAddresses = Array.from(duplicates)

    // Calculate estimated upload time
    const batchCount = Math.ceil(validAddresses.length / batchSize)
    const estimatedSeconds = batchCount * 2 // ~2 seconds per batch
    const estimatedUploadTime = this.formatDuration(estimatedSeconds)

    onProgress?.({
      stage: 'complete',
      progress: 100,
      currentLine,
      totalLines: currentLine,
      message: `Готово! Найдено ${validAddresses.length} уникальных адресов`
    })

    return {
      validAddresses,
      duplicates: duplicateAddresses,
      invalidAddresses,
      stats: {
        totalLines: currentLine,
        validCount: validAddresses.length,
        duplicateCount: duplicateAddresses.length,
        invalidCount: invalidAddresses.length,
        estimatedUploadTime
      }
    }
  }

  /**
   * Process small text input (addresses separated by newlines)
   */
  processTextInput(text: string, batchSize: number = DEFAULT_BATCH_SIZE): FileProcessingResult {
    const addresses = new Set<string>()
    const duplicates = new Set<string>()
    const invalidAddresses: Array<{ value: string; line: number; error: string }> = []

    const lines = text.split('\n')

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return

      const normalizedAddress = trimmed.toLowerCase()

      if (!this.isValidAddress(normalizedAddress)) {
        invalidAddresses.push({
          value: trimmed,
          line: index + 1,
          error: 'Некорректный формат адреса'
        })
        return
      }

      if (addresses.has(normalizedAddress)) {
        duplicates.add(normalizedAddress)
      } else {
        addresses.add(normalizedAddress)
      }
    })

    const validAddresses = Array.from(addresses)
    const duplicateAddresses = Array.from(duplicates)
    const batchCount = Math.ceil(validAddresses.length / batchSize)
    const estimatedSeconds = batchCount * 2
    const estimatedUploadTime = this.formatDuration(estimatedSeconds)

    return {
      validAddresses,
      duplicates: duplicateAddresses,
      invalidAddresses,
      stats: {
        totalLines: lines.length,
        validCount: validAddresses.length,
        duplicateCount: duplicateAddresses.length,
        invalidCount: invalidAddresses.length,
        estimatedUploadTime
      }
    }
  }

  private async readChunk(chunk: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(chunk)
    })
  }

  private isValidAddress(address: string): boolean {
    return this.ADDRESS_REGEX.test(address)
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `~${Math.ceil(seconds)} сек`
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60)
      return `~${minutes} мин`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.ceil((seconds % 3600) / 60)
      return `~${hours}ч ${minutes}м`
    }
  }
}
