'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '@/components/ui/notifications'
import {
  getMigrations,
  runMigration,
  dryRunMigration,
  type MigrationStatus,
  type MigrationRunResponse
} from '@/lib/api/admin'

export function useMigrations() {
  const queryClient = useQueryClient()
  const notifications = useNotifications()

  const [selectedMigration, setSelectedMigration] = useState<MigrationStatus | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [dryRunResult, setDryRunResult] = useState<MigrationRunResponse | null>(null)
  const [expandedMigration, setExpandedMigration] = useState<string | null>(null)

  // Fetch migrations
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-migrations'],
    queryFn: getMigrations
  })

  // Run migration mutation
  const runMigrationMutation = useMutation({
    mutationFn: (filename: string) => runMigration(filename, false),
    onSuccess: (result) => {
      if (result.success) {
        notifications.success(
          'Migration applied',
          `Successfully applied migration. ${result.result.affectedDocuments} documents affected.`
        )
      } else {
        notifications.error(
          'Migration failed',
          result.error || 'Unknown error occurred'
        )
      }
      queryClient.invalidateQueries({ queryKey: ['admin-migrations'] })
      setConfirmDialogOpen(false)
      setSelectedMigration(null)
    },
    onError: (error: Error) => {
      notifications.error(
        'Migration failed',
        error.message || 'Failed to run migration'
      )
      setConfirmDialogOpen(false)
    }
  })

  // Dry run mutation
  const dryRunMutation = useMutation({
    mutationFn: dryRunMigration,
    onSuccess: (result) => {
      setDryRunResult(result)
      if (!result.success) {
        notifications.error(
          'Dry run failed',
          result.error || 'Unknown error occurred'
        )
      }
    },
    onError: (error: Error) => {
      notifications.error(
        'Dry run failed',
        error.message || 'Failed to run dry run'
      )
    }
  })

  const handleApply = useCallback((migration: MigrationStatus) => {
    setSelectedMigration(migration)
    setConfirmDialogOpen(true)
  }, [])

  const handleConfirmApply = useCallback(() => {
    if (selectedMigration) {
      runMigrationMutation.mutate(selectedMigration.filename)
    }
  }, [selectedMigration, runMigrationMutation])

  const handleDryRun = useCallback((migration: MigrationStatus) => {
    setSelectedMigration(migration)
    setDryRunResult(null)
    dryRunMutation.mutate(migration.filename)
  }, [dryRunMutation])

  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  const handleToggleExpand = useCallback((filename: string) => {
    setExpandedMigration(prev => prev === filename ? null : filename)
  }, [])

  const clearDryRunResult = useCallback(() => {
    setDryRunResult(null)
  }, [])

  return {
    // Data
    data,
    isLoading,
    error,

    // Selection state
    selectedMigration,
    expandedMigration,
    dryRunResult,
    confirmDialogOpen,

    // Mutation states
    isRunningMigration: runMigrationMutation.isPending,
    isRunningDryRun: dryRunMutation.isPending,

    // Actions
    refetch,
    handleApply,
    handleConfirmApply,
    handleDryRun,
    handleCloseConfirmDialog,
    handleToggleExpand,
    clearDryRunResult
  }
}
