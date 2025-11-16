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

      // Validate each entry
      for (const entry of parsed) {
        if (!entry.walletAddress || !entry.rewardLink) {
          throw new Error('Each winner must have walletAddress and rewardLink')
        }

        // Validate Ethereum address
        if (!/^0x[a-fA-F0-9]{40}$/.test(entry.walletAddress)) {
          throw new Error(`Invalid Ethereum address: ${entry.walletAddress}`)
        }

        // Validate URL
        try {
          new URL(entry.rewardLink)
        } catch {
          throw new Error(`Invalid URL: ${entry.rewardLink}`)
        }
      }

      setPreview(parsed)
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
            placeholder={`[\n  {\n    "walletAddress": "0x...",\n    "rewardLink": "https://...",\n    "place": 1,\n    "rewardType": "Grand Prize"\n  }\n]`}
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
            <strong>Note:</strong> One wallet can receive multiple rewards. Simply include multiple entries with the same wallet address but different reward links.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
