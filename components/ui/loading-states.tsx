// Loading state components

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800',
        className
      )}
    />
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn('rounded-lg border bg-white p-6', className)}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

interface SurveyTableSkeletonProps {
  rows?: number
  className?: string
}

export function SurveyTableSkeleton({ rows = 5, className }: SurveyTableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Table header */}
      <div className="hidden md:grid grid-cols-4 gap-4 p-4 border-b bg-zinc-50">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-18" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="hidden md:grid grid-cols-4 gap-4 p-4 border-b">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    </div>
  )
}

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = 'Loading...', className }: PageLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4 text-orange-500" />
        <p className="text-zinc-600">{message}</p>
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export function LoadingButton({
  loading = false,
  children,
  className,
  disabled,
  onClick,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg',
        'bg-orange-500 hover:bg-orange-600 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
      disabled={loading || disabled}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
}

interface LoadingOverlayProps {
  visible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({
  visible,
  message = 'Loading...',
  className
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        className
      )}
    >
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4 text-orange-500" />
          <p className="text-zinc-700">{message}</p>
        </div>
      </div>
    </div>
  )
}

interface InlineLoadingProps {
  size?: 'sm' | 'md'
  message?: string
  className?: string
}

export function InlineLoading({
  size = 'sm',
  message,
  className
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size={size} className="text-orange-500" />
      {message && (
        <span className="text-zinc-600 text-sm">{message}</span>
      )}
    </div>
  )
}

interface LoadingStateProps {
  loading: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  children: React.ReactNode
  skeleton?: React.ReactNode
  className?: string
}

export function LoadingState({
  loading,
  error,
  empty = false,
  emptyMessage = 'No data available',
  children,
  skeleton,
  className
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className={className}>
        {skeleton || <PageLoading />}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-red-600 mb-2">Error</div>
        <p className="text-zinc-600">{error}</p>
      </div>
    )
  }

  if (empty) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-zinc-600">{emptyMessage}</p>
      </div>
    )
  }

  return <div className={className}>{children}</div>
}

// Additional specialized skeletons
export function SurveyQuestionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 border rounded-lg">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function RewardPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('text-center space-y-8', className)}>
      <Skeleton className="h-8 w-64 mx-auto" />
      <Skeleton className="h-32 w-32 mx-auto rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

export function HeardPointsHistorySkeleton({ rows = 5, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AuthSectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-4', className)}>
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
