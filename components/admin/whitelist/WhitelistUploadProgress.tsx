/**
 * Detailed progress UI for whitelist batch uploads
 * Shows real-time progress, statistics, and error handling
 */

import React from 'react'
import { ProcessingProgress } from '../../../lib/whitelist/WhitelistFileProcessor'
import { UploadProgress } from '../../../lib/whitelist/WhitelistBatchUploader'

interface WhitelistUploadProgressProps {
  fileProcessingProgress?: ProcessingProgress
  uploadProgress?: UploadProgress
  onCancel?: () => void
  onRetry?: () => void
  onClose?: () => void
}

export function WhitelistUploadProgress({
  fileProcessingProgress,
  uploadProgress,
  onCancel,
  onRetry,
  onClose
}: WhitelistUploadProgressProps) {
  const isProcessingFile = fileProcessingProgress && fileProcessingProgress.stage !== 'complete'
  const isUploading = uploadProgress && !['completed', 'error'].includes(uploadProgress.stage)
  const isCompleted = uploadProgress?.stage === 'completed'
  const hasError = uploadProgress?.stage === 'error'

  if (isProcessingFile && fileProcessingProgress) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Обработка файла
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {fileProcessingProgress.message}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Прогресс обработки
              </span>
              <span className="text-sm text-gray-500">
                {fileProcessingProgress.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${fileProcessingProgress.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Обработано строк:</span>
              <span className="ml-1 font-medium">
                {fileProcessingProgress.currentLine.toLocaleString()}
                {fileProcessingProgress.totalLines && (
                  <span className="text-gray-500">
                    {' из '}
                    {fileProcessingProgress.totalLines.toLocaleString()}
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Этап:</span>
              <span className="ml-1 font-medium capitalize">
                {getStageLabel(fileProcessingProgress.stage)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (uploadProgress) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isCompleted ? 'Загрузка завершена' : hasError ? 'Ошибка загрузки' : 'Загрузка whitelist'}
          </h3>
          {uploadProgress.session && (
            <p className="text-sm text-gray-600 mt-1">
              Сессия: {uploadProgress.session.sessionId}
            </p>
          )}
        </div>

        {!hasError && (
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Общий прогресс
                </span>
                <span className="text-sm text-gray-500">
                  {uploadProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadProgress.processedAddresses.toLocaleString()}
                </div>
                <div className="text-gray-600">Обработано</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {uploadProgress.totalAddresses.toLocaleString()}
                </div>
                <div className="text-gray-600">Всего адресов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {uploadProgress.totalBatches}
                </div>
                <div className="text-gray-600">Всего батчей</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Текущий батч:</span>
                <span className="ml-1 font-medium">
                  {uploadProgress.currentBatch} из {uploadProgress.totalBatches}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Скорость:</span>
                <span className="ml-1 font-medium">
                  {uploadProgress.speed}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Осталось:</span>
                <span className="ml-1 font-medium">
                  {uploadProgress.eta}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Этап:</span>
                <span className="ml-1 font-medium">
                  {getUploadStageLabel(uploadProgress.stage)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {uploadProgress.errors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Ошибки ({uploadProgress.errors.length})
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
              {uploadProgress.errors.map((error, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-red-800">
                    Батч {error.batchIndex + 1}
                  </div>
                  <div className="text-red-600 mt-1">
                    {error.message}
                  </div>
                  {error.addresses && error.addresses.length > 0 && (
                    <div className="text-red-500 text-xs mt-1">
                      Первые адреса: {error.addresses.join(', ')}
                      {error.addresses.length > 3 && '...'}
                    </div>
                  )}
                  {index < uploadProgress.errors.length - 1 && (
                    <hr className="my-2 border-red-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          {isUploading && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Отменить
            </button>
          )}
          
          {hasError && onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Повторить
            </button>
          )}
          
          {(isCompleted || hasError) && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Закрыть
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

function getStageLabel(stage: ProcessingProgress['stage']): string {
  const labels: Record<ProcessingProgress['stage'], string> = {
    reading: 'Чтение файла',
    parsing: 'Парсинг данных',
    validating: 'Валидация адресов',
    deduplicating: 'Удаление дубликатов',
    complete: 'Завершено'
  }
  return labels[stage] || stage
}

function getUploadStageLabel(stage: UploadProgress['stage']): string {
  const labels: Record<UploadProgress['stage'], string> = {
    creating_session: 'Создание сессии',
    uploading: 'Загрузка батчей',
    completing: 'Завершение',
    completed: 'Завершено',
    error: 'Ошибка'
  }
  return labels[stage] || stage
}