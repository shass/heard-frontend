import { Spinner } from '@/components/ui/loading-states'
import { AlertTriangle } from 'lucide-react'

interface LoadingErrorStatesProps {
  isLoading: boolean
  error: Error | null
}

export function LoadingErrorStates({ isLoading, error }: LoadingErrorStatesProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertTriangle className="w-5 h-5 mr-2" />
        Failed to load addresses
      </div>
    )
  }

  return null
}