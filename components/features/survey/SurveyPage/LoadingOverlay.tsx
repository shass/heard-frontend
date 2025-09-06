interface LoadingOverlayProps {
  shouldShow: boolean
  message: string
}

export function LoadingOverlay({ shouldShow, message }: LoadingOverlayProps) {
  if (!shouldShow) return null

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-900">{message}</p>
      </div>
    </div>
  )
}