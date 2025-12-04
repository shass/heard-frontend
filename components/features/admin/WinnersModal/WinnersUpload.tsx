'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAddWinners } from '@/hooks'
import { Upload } from 'lucide-react'
import type { WinnerEntry } from '@/lib/types'

interface WinnersUploadProps {
  surveyId: string
  onSuccess: () => void
}

export function WinnersUpload({ surveyId, onSuccess }: WinnersUploadProps) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<WinnerEntry[] | null>(null)

  const addWinners = useAddWinners()

  const handleParse = () => {
    setError(null)
    setPreview(null)

    try {
      const parsed = JSON.parse(jsonText)

      // Validate format
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of winner objects')
      }

      // Validate each entry and normalize field names
      const normalizedEntries: WinnerEntry[] = []
      for (const entry of parsed) {
        // Support both old format (walletAddress/rewardLink) and new format (address/reward)
        const walletAddress = entry.address || entry.walletAddress
        const rewardLink = entry.reward || entry.rewardLink

        if (!walletAddress || !rewardLink) {
          throw new Error('Each winner must have address and reward fields')
        }

        // Basic wallet address validation (just check it's not empty)
        if (!walletAddress || walletAddress.trim().length === 0) {
          throw new Error(`Invalid wallet address: ${walletAddress}`)
        }

        // Validate URL
        try {
          new URL(rewardLink)
        } catch {
          throw new Error(`Invalid URL: ${rewardLink}`)
        }

        // Normalize to internal format
        normalizedEntries.push({
          walletAddress,
          rewardLink,
          place: entry.place,
          rewardType: entry.rewardType
        })
      }

      setPreview(normalizedEntries)
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format')
    }
  }

  const handleUpload = () => {
    if (!preview) return

    addWinners.mutate(
      {
        surveyId,
        request: { winners: preview }
      },
      {
        onSuccess: () => {
          setJsonText('')
          setPreview(null)
          onSuccess()
        }
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Winners JSON</CardTitle>
        <CardDescription>
          Upload multiple winners at once using JSON format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`[\n  {\n    "address": "0x...",\n    "reward": "https://..."\n  },\n  {\n    "address": "0x...",\n    "reward": "https://..."\n  }\n]`}
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={handleParse} variant="outline">
            Validate JSON
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!preview || addWinners.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {addWinners.isPending ? 'Uploading...' : 'Upload Winners'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {preview && (
          <div className="border rounded-md p-4">
            <h4 className="font-semibold mb-2">Preview ({preview.length} winners)</h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {preview.map((winner, index) => (
                <div key={index} className="text-sm text-zinc-600">
                  {index + 1}. {winner.walletAddress.slice(0, 10)}...{' '}
                  {winner.place && `(#${winner.place})`}
                  {winner.rewardType && ` - ${winner.rewardType}`}
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Note:</strong> Each wallet can only receive one reward per survey. If you upload a duplicate wallet address, it will replace the existing reward for that wallet.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
