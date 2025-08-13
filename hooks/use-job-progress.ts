import { useState, useEffect, useCallback } from 'react'
import { jobProgressClient, JobProgress } from '@/lib/websocket/job-progress-client'

export interface UseJobProgressReturn {
  progress: JobProgress | null
  isConnected: boolean
  error: string | null
  connectionState: string
}

export function useJobProgress(jobId: string | null): UseJobProgressReturn {
  const [progress, setProgress] = useState<JobProgress | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProgress = useCallback((progressData: JobProgress) => {
    setProgress(progressData)
    
    // Clear error when receiving progress
    if (error) {
      setError(null)
    }
  }, [error])

  const handleConnection = useCallback((connected: boolean) => {
    setIsConnected(connected)
    
    // Clear error when connected
    if (connected && error) {
      setError(null)
    }
  }, [error])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [])

  useEffect(() => {
    if (!jobId) {
      // Reset state when no job ID
      setProgress(null)
      setIsConnected(false)
      setError(null)
      return
    }

    // Subscribe to job progress
    const unsubscribe = jobProgressClient.subscribe(
      jobId,
      handleProgress,
      handleConnection,
      handleError
    )

    // Cleanup subscription on unmount or job ID change
    return () => {
      unsubscribe()
      setProgress(null)
      setIsConnected(false)
      setError(null)
    }
  }, [jobId, handleProgress, handleConnection, handleError])

  return {
    progress,
    isConnected,
    error,
    connectionState: jobProgressClient.getConnectionState()
  }
}

// Convenience hook for job completion detection
export function useJobCompletion(
  jobId: string | null,
  onCompleted?: (progress: JobProgress) => void,
  onFailed?: (progress: JobProgress) => void
) {
  const { progress } = useJobProgress(jobId)

  useEffect(() => {
    if (!progress) return

    if (progress.status === 'completed' && onCompleted) {
      onCompleted(progress)
    }

    if (progress.status === 'failed' && onFailed) {
      onFailed(progress)
    }
  }, [progress, onCompleted, onFailed])

  return { progress }
}