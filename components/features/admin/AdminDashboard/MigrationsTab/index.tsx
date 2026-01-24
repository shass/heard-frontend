'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading-states'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Database,
  Play,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { useMigrations } from '../hooks/useMigrations'
import { type MigrationStatus, type MigrationRunResponse } from '@/lib/api/admin'

function getStatusBadge(status: MigrationStatus['status']) {
  switch (status) {
    case 'applied':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
          Applied
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
          Pending
        </Badge>
      )
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />
          Failed
        </Badge>
      )
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

interface DryRunResultProps {
  result: MigrationRunResponse
}

function DryRunResult({ result }: DryRunResultProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium text-blue-800 mb-2">
        Dry Run Result
      </h4>
      {result.success ? (
        <div className="space-y-2">
          <p className="text-blue-700">
            Would affect{' '}
            <strong>{result.result.affectedDocuments}</strong>{' '}
            documents
          </p>
          {result.result.changes && result.result.changes.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-blue-600 mb-1">
                Sample changes (first 5):
              </p>
              <div className="bg-white rounded border border-blue-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Document ID</th>
                      <th className="px-2 py-1 text-left">Field</th>
                      <th className="px-2 py-1 text-left">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.result.changes.slice(0, 5).map((change, i) => (
                      <tr key={i} className="border-t border-blue-100">
                        <td className="px-2 py-1 font-mono">
                          {change.documentId.slice(0, 8)}...
                        </td>
                        <td className="px-2 py-1">{change.field}</td>
                        <td className="px-2 py-1">
                          <span className="text-red-600">
                            {JSON.stringify(change.oldValue)}
                          </span>
                          {' → '}
                          <span className="text-green-600">
                            {JSON.stringify(change.newValue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.result.changes.length > 5 && (
                <p className="text-xs text-blue-600 mt-1">
                  ...and {result.result.changes.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-red-700">{result.error || 'Dry run failed'}</p>
      )}
    </div>
  )
}

interface MigrationCardProps {
  migration: MigrationStatus
  isExpanded: boolean
  dryRunResult: MigrationRunResponse | null
  selectedMigrationFilename: string | null
  isRunningDryRun: boolean
  isRunningMigration: boolean
  onToggleExpand: (filename: string) => void
  onDryRun: (migration: MigrationStatus) => void
  onApply: (migration: MigrationStatus) => void
}

function MigrationCard({
  migration,
  isExpanded,
  dryRunResult,
  selectedMigrationFilename,
  isRunningDryRun,
  isRunningMigration,
  onToggleExpand,
  onDryRun,
  onApply
}: MigrationCardProps) {
  const showDryRunResult = dryRunResult && selectedMigrationFilename === migration.filename

  return (
    <Card>
      <Collapsible
        open={isExpanded}
        onOpenChange={() => onToggleExpand(migration.filename)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    aria-label={isExpanded ? 'Collapse migration details' : 'Expand migration details'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <div>
                  <CardTitle className="text-base">
                    {migration.meta.name}
                  </CardTitle>
                  <code className="text-xs text-gray-500">
                    {migration.filename}
                  </code>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(migration.status)}
              <div className="flex gap-2">
                {migration.meta.supportsDryRun && migration.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDryRun(migration)}
                    disabled={isRunningDryRun}
                    aria-label={`Dry run ${migration.meta.name}`}
                  >
                    <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
                    {isRunningDryRun && selectedMigrationFilename === migration.filename
                      ? 'Running...'
                      : 'Dry Run'}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onApply(migration)}
                  disabled={migration.status === 'applied' || isRunningMigration}
                  aria-label={`Apply ${migration.meta.name}`}
                >
                  <Play className="w-4 h-4 mr-1" aria-hidden="true" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm text-gray-600">
                {migration.meta.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="font-medium">{formatDate(migration.meta.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Author:</span>
                  <p className="font-medium">{migration.meta.author}</p>
                </div>
                <div>
                  <span className="text-gray-500">Collections:</span>
                  <p className="font-medium">{migration.meta.affectedCollections.join(', ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Est. Duration:</span>
                  <p className="font-medium">{migration.meta.estimatedDuration || 'Unknown'}</p>
                </div>
              </div>

              {migration.status === 'applied' && migration.result && (
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-green-800">
                    Applied by {migration.appliedBy} on {formatDate(migration.appliedAt)}
                  </p>
                  <p className="text-green-700">
                    {migration.result.affectedDocuments} documents affected in {migration.result.durationMs}ms
                  </p>
                </div>
              )}

              {migration.status === 'failed' && migration.result?.error && (
                <div className="bg-red-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-red-800">Error:</p>
                  <p className="text-red-700">{migration.result.error}</p>
                </div>
              )}

              {showDryRunResult && <DryRunResult result={dryRunResult} />}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function MigrationsTab() {
  const {
    data,
    isLoading,
    error,
    selectedMigration,
    expandedMigration,
    dryRunResult,
    confirmDialogOpen,
    isRunningMigration,
    isRunningDryRun,
    refetch,
    handleApply,
    handleConfirmApply,
    handleDryRun,
    handleCloseConfirmDialog,
    handleToggleExpand
  } = useMigrations()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <Spinner size="lg" />
        <span className="sr-only">Loading migrations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-red-600" role="alert">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" aria-hidden="true" />
            <p>Failed to load migrations</p>
            <p className="text-sm text-gray-500 mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" aria-hidden="true" />
              <div>
                <CardTitle>Database Migrations</CardTitle>
                <CardDescription>
                  Manage database schema and data migrations
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              aria-label="Refresh migrations list"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Total:</span>
              <span className="font-medium">{data?.total || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Pending:</span>
              <span className="font-medium text-yellow-600">{data?.pending || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Applied:</span>
              <span className="font-medium text-green-600">{data?.applied || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migrations List */}
      <div className="space-y-4">
        {data?.migrations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No migrations found
            </CardContent>
          </Card>
        ) : (
          data?.migrations.map((migration) => (
            <MigrationCard
              key={migration.filename}
              migration={migration}
              isExpanded={expandedMigration === migration.filename}
              dryRunResult={dryRunResult}
              selectedMigrationFilename={selectedMigration?.filename || null}
              isRunningDryRun={isRunningDryRun}
              isRunningMigration={isRunningMigration}
              onToggleExpand={handleToggleExpand}
              onDryRun={handleDryRun}
              onApply={handleApply}
            />
          ))
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={handleCloseConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Migration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply migration{' '}
              <strong>{selectedMigration?.meta.name}</strong>?
              <br />
              <br />
              This will modify the database and cannot be undone automatically.
              Make sure you have a backup before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApply}
              disabled={isRunningMigration}
            >
              {isRunningMigration ? 'Applying...' : 'Apply Migration'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
