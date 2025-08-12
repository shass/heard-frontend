import { useEffect, useRef, useState, useCallback } from 'react'

export interface ImportProgress {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  processedItems: number
  totalItems: number
  currentBatch: number
  totalBatches: number
  speed: number // items per second
  estimatedTimeRemaining: number // seconds
  errors: Array<{
    line?: number
    value?: string
    message: string
    timestamp: string
  }>
}

interface WebSocketMessage {
  type: 'connected' | 'progress' | 'job_update' | 'error' | 'pong'
  jobId?: string
  data?: any
  message?: string
  timestamp?: number
}

class ImportWebSocketService {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private pingTimer: NodeJS.Timeout | null = null
  private readonly maxReconnectAttempts = 5
  private reconnectAttempts = 0
  private readonly reconnectDelay = 1000
  
  private listeners = new Map<string, Set<(progress: ImportProgress) => void>>()
  private statusListeners = new Set<(status: 'connected' | 'disconnected' | 'error') => void>()

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = process.env.NODE_ENV === 'development' 
      ? 'localhost:3001' 
      : window.location.host
    
    return `${protocol}//${host}/ws/import-progress`
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      try {
        this.ws = new WebSocket(this.getWebSocketUrl())
        
        this.ws.onopen = () => {
          console.log('Import WebSocket connected')
          this.reconnectAttempts = 0
          this.startPingPong()
          this.statusListeners.forEach(listener => listener('connected'))
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          console.log('Import WebSocket disconnected', event.code, event.reason)
          this.cleanup()
          this.statusListeners.forEach(listener => listener('disconnected'))
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('Import WebSocket error:', error)
          this.statusListeners.forEach(listener => listener('error'))
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.cleanup()
    if (this.ws) {
      this.ws.close(1000)
      this.ws = null
    }
  }

  subscribe(jobId: string, callback: (progress: ImportProgress) => void): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set())
    }
    
    this.listeners.get(jobId)!.add(callback)
    
    // Send subscribe message
    this.sendMessage({
      type: 'subscribe',
      jobId
    })

    // Return unsubscribe function
    return () => {
      const jobListeners = this.listeners.get(jobId)
      if (jobListeners) {
        jobListeners.delete(callback)
        
        // If no more listeners for this job, unsubscribe
        if (jobListeners.size === 0) {
          this.listeners.delete(jobId)
          this.sendMessage({
            type: 'unsubscribe',
            jobId
          })
        }
      }
    }
  }

  onStatusChange(callback: (status: 'connected' | 'disconnected' | 'error') => void): () => void {
    this.statusListeners.add(callback)
    
    return () => {
      this.statusListeners.delete(callback)
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      
      switch (message.type) {
        case 'connected':
          console.log('WebSocket connection confirmed')
          break
          
        case 'progress':
          if (message.jobId && message.data) {
            this.notifyListeners(message.jobId, message.data)
          }
          break
          
        case 'job_update':
          if (message.jobId && message.data) {
            // Update job status (cancelled, failed, etc.)
            this.notifyListeners(message.jobId, message.data)
          }
          break
          
        case 'error':
          console.error('WebSocket server error:', message.message)
          break
          
        case 'pong':
          // Ping response - connection is alive
          break
          
        default:
          console.warn('Unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private notifyListeners(jobId: string, data: ImportProgress): void {
    const jobListeners = this.listeners.get(jobId)
    if (jobListeners) {
      jobListeners.forEach(callback => callback(data))
    }
  }

  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private startPingPong(): void {
    this.pingTimer = setInterval(() => {
      this.sendMessage({ type: 'ping' })
    }, 30000) // Ping every 30 seconds
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('WebSocket reconnect failed:', error)
      })
    }, delay)
  }
}

// Singleton instance
const importWebSocketService = new ImportWebSocketService()

/**
 * React hook for import progress WebSocket
 */
export function useImportWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const serviceRef = useRef(importWebSocketService)

  useEffect(() => {
    const unsubscribeStatus = serviceRef.current.onStatusChange(setConnectionStatus)
    
    // Auto-connect
    serviceRef.current.connect().catch(error => {
      console.error('Failed to connect to import WebSocket:', error)
    })

    return () => {
      unsubscribeStatus()
      // Don't disconnect here as other components might be using it
    }
  }, [])

  const subscribeToJob = useCallback((jobId: string, callback: (progress: ImportProgress) => void) => {
    return serviceRef.current.subscribe(jobId, callback)
  }, [])

  return {
    connectionStatus,
    subscribeToJob,
    connect: () => serviceRef.current.connect(),
    disconnect: () => serviceRef.current.disconnect()
  }
}

/**
 * Hook for tracking a specific import job
 */
export function useImportProgress(jobId: string | null) {
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const { subscribeToJob } = useImportWebSocket()

  useEffect(() => {
    if (!jobId) {
      setProgress(null)
      return
    }

    const unsubscribe = subscribeToJob(jobId, (newProgress) => {
      setProgress(newProgress)
    })

    return unsubscribe
  }, [jobId, subscribeToJob])

  return progress
}