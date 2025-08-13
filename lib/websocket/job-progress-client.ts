import { env } from '@/lib/env'

export interface JobProgress {
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

export type JobProgressCallback = (progress: JobProgress) => void
export type JobConnectionCallback = (connected: boolean) => void
export type JobErrorCallback = (error: string) => void

interface Subscription {
  jobId: string
  onProgress: JobProgressCallback
  onConnection?: JobConnectionCallback
  onError?: JobErrorCallback
}

export class JobProgressClient {
  private ws: WebSocket | null = null
  private subscriptions = new Map<string, Subscription>()
  private isConnecting = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') return ''
    
    const apiUrl = env.API_URL
    
    // Handle relative API URLs like "/api"
    if (apiUrl.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      return `${protocol}//${host}/ws/import-progress`
    }
    
    // Handle absolute API URLs like "http://localhost:3001/api"
    const baseUrl = apiUrl.replace(/\/api\/?$/, '')
    const wsUrl = baseUrl.replace(/^https?/, baseUrl.startsWith('https') ? 'wss' : 'ws')
    
    return `${wsUrl}/ws/import-progress`
  }

  private async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      const wsUrl = this.getWebSocketUrl()
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0

        // Notify all subscriptions about connection
        this.subscriptions.forEach((sub) => {
          sub.onConnection?.(true)
        })

        // Re-subscribe to all active jobs
        this.subscriptions.forEach((sub) => {
          this.sendSubscription(sub.jobId)
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('JobProgressClient: Failed to parse message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('JobProgressClient: WebSocket error:', error)
        this.subscriptions.forEach((sub) => {
          sub.onError?.('WebSocket connection error')
        })
      }

      this.ws.onclose = () => {
        this.isConnecting = false
        this.ws = null

        // Notify all subscriptions about disconnection
        this.subscriptions.forEach((sub) => {
          sub.onConnection?.(false)
        })

        // Attempt reconnection if there are active subscriptions
        if (this.subscriptions.size > 0) {
          this.attemptReconnect()
        }
      }
    } catch (error) {
      this.isConnecting = false
      console.error('JobProgressClient: Failed to create WebSocket:', error)
      this.subscriptions.forEach((sub) => {
        sub.onError?.('Failed to connect to progress tracking')
      })
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('JobProgressClient: Max reconnection attempts reached')
      this.subscriptions.forEach((sub) => {
        sub.onError?.('Connection failed after multiple attempts')
      })
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++


    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private sendSubscription(jobId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type: 'subscribe',
        jobId
      })
      this.ws.send(message)
    }
  }

  private sendUnsubscription(jobId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        jobId
      }))
    }
  }

  private handleMessage(message: any): void {
    if (message.type === 'progress' && message.jobId) {
      const subscription = this.subscriptions.get(message.jobId)
      if (subscription) {
        // Pass the complete progress object with jobId
        const progressData = {
          jobId: message.jobId,
          ...message.data
        }
        subscription.onProgress(progressData)
      }
    }

    if (message.type === 'error') {
      const subscription = this.subscriptions.get(message.jobId)
      if (subscription) {
        subscription.onError?.(message.message || 'Unknown error')
      }
    }
  }

  public subscribe(
    jobId: string,
    onProgress: JobProgressCallback,
    onConnection?: JobConnectionCallback,
    onError?: JobErrorCallback
  ): () => void {
    // Store subscription
    this.subscriptions.set(jobId, {
      jobId,
      onProgress,
      onConnection,
      onError
    })

    // Connect if not already connected
    this.connect()

    // Send subscription if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(jobId)
    }

    // Return unsubscribe function
    return () => this.unsubscribe(jobId)
  }

  public unsubscribe(jobId: string): void {
    // Send unsubscribe message
    this.sendUnsubscription(jobId)

    // Remove from local subscriptions
    this.subscriptions.delete(jobId)

    // Close connection if no more subscriptions
    if (this.subscriptions.size === 0 && this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  public disconnect(): void {
    // Clear all subscriptions
    this.subscriptions.clear()

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.reconnectAttempts = 0
    this.isConnecting = false
  }

  public getConnectionState(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'disconnected'
      default: return 'unknown'
    }
  }
}

// Singleton instance
export const jobProgressClient = new JobProgressClient()