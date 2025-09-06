import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { MIN_BATCH_SIZE, MAX_BATCH_SIZE, BATCH_SIZE_STEP } from '@/lib/whitelist/constants'

interface UploadSettingsProps {
  replaceMode: boolean
  onReplaceModeChange: (checked: boolean) => void
  batchSize: number
  onBatchSizeChange: (value: number) => void
  isWorking: boolean
  hasData: boolean
}

export function UploadSettings({
  replaceMode,
  onReplaceModeChange,
  batchSize,
  onBatchSizeChange,
  isWorking,
  hasData
}: UploadSettingsProps) {
  if (!hasData) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Switch
          id="replace-mode"
          checked={replaceMode}
          onCheckedChange={onReplaceModeChange}
          disabled={isWorking}
        />
        <div className="flex-1">
          <Label htmlFor="replace-mode" className="text-sm font-medium">
            {replaceMode ? 'Replace existing whitelist' : 'Add to existing whitelist'}
          </Label>
          <p className="text-xs text-gray-600">
            {replaceMode
              ? 'All current addresses will be removed and replaced with imported ones'
              : 'New addresses will be added to the existing whitelist (duplicates will be skipped)'
            }
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex-1">
          <Label htmlFor="batch-size" className="text-sm font-medium text-gray-700">
            Batch Size: {batchSize} addresses
          </Label>
          <p className="text-xs text-gray-600">
            Larger batches = faster upload, smaller batches = more stable ({MIN_BATCH_SIZE}-{MAX_BATCH_SIZE})
          </p>
        </div>
        <div className="w-24">
          <input
            id="batch-size"
            type="number"
            min={MIN_BATCH_SIZE}
            max={MAX_BATCH_SIZE}
            step={BATCH_SIZE_STEP}
            value={batchSize}
            onChange={(e) => {
              const value = Math.max(MIN_BATCH_SIZE, Math.min(MAX_BATCH_SIZE, Number(e.target.value) || MIN_BATCH_SIZE))
              onBatchSizeChange(value)
            }}
            disabled={isWorking}
            className="w-full px-3 py-1 text-sm text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  )
}