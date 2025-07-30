'use client'

import { useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

interface NotificationItemProps {
  notification: Notification
  onClose: (id: string) => void
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { id, type, title, message, duration = 5000, action } = notification

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-zinc-900" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  }

  const borderColors = {
    success: 'border-l-zinc-900',
    error: 'border-l-red-500',
    warning: 'border-l-yellow-500',
    info: 'border-l-blue-500'
  }

  const bgColors = {
    success: 'bg-zinc-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50'
  }

  return (
    <div
      className={cn(
        'relative flex w-full max-w-sm overflow-hidden rounded-lg border-l-4 bg-white shadow-lg',
        borderColors[type],
        bgColors[type]
      )}
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="text-sm font-medium text-zinc-900">
            {title}
          </div>
          {message && (
            <div className="mt-1 text-sm text-zinc-600">
              {message}
            </div>
          )}
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className="text-sm font-medium text-orange-600 hover:text-orange-500"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onClose(id)}
            className="inline-flex rounded-md text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useUIStore()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-4">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  )
}

// Hook to easily add notifications
export function useNotifications() {
  const { addNotification } = useUIStore()

  return {
    success: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', title, message, ...options }),
    
    error: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', title, message, ...options }),
    
    warning: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', title, message, ...options }),
    
    custom: (notification: Omit<Notification, 'id'>) =>
      addNotification(notification)
  }
}