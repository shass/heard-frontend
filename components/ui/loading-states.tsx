// Loading state components

import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'
import React from 'react';

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
