'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react'

interface Visibility {
  visibilityMode: 'private' | 'public' | 'link'
  shareUrl?: string
  visibilityChangedAt?: string
}

interface VisibilityTabProps {
  visibility: Visibility | undefined
  visibilityLoading: boolean
  generateLink: { isPending: boolean }
  handleVisibilityChange: (mode: 'private' | 'public' | 'link') => Promise<void>
  handleGenerateLink: () => Promise<void>
  copyToClipboard: (text: string, label: string) => void
  openResults: () => void
  getResultsUrl: () => string
}

export function VisibilityTab({
  visibility,
  visibilityLoading,
  generateLink,
  handleVisibilityChange,
  handleGenerateLink,
  copyToClipboard,
  openResults,
  getResultsUrl,
}: VisibilityTabProps) {
  return (
    <div className="space-y-6 p-1">
      {/* Current Visibility Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          {visibilityLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : visibility ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {visibility.visibilityMode === 'public' ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : visibility.visibilityMode === 'link' ? (
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-600" />
                  )}
                  <div>
                    <div className="font-medium capitalize">
                      {visibility.visibilityMode} Access
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {visibility.visibilityMode === 'public' 
                        ? 'Anyone can view results without authentication'
                        : visibility.visibilityMode === 'link'
                        ? 'Results accessible via special shareable link'
                        : 'Only admins and survey clients can view results'
                      }
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openResults}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Results Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey Results Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Direct link to view survey results
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {getResultsUrl()}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(getResultsUrl(), 'Results link')}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openResults}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {/* Private */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                visibility?.visibilityMode === 'private'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleVisibilityChange('private')}
            >
              <div className="flex items-center gap-3">
                <EyeOff className="h-5 w-5" />
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-sm text-muted-foreground">
                    Only admins and survey clients can view
                  </div>
                </div>
              </div>
            </div>

            {/* Public */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                visibility?.visibilityMode === 'public'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleVisibilityChange('public')}
            >
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5" />
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-sm text-muted-foreground">
                    Anyone can view without authentication
                  </div>
                </div>
              </div>
            </div>

            {/* Link */}
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                visibility?.visibilityMode === 'link'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleVisibilityChange('link')}
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5" />
                <div>
                  <div className="font-medium">Link Access</div>
                  <div className="text-sm text-muted-foreground">
                    Accessible via special shareable link
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Link Management */}
      {visibility?.visibilityMode === 'link' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Share Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Generate a secure link for sharing survey results
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLink}
                disabled={generateLink.isPending}
              >
                {visibility.shareUrl ? 'Regenerate' : 'Generate'} Link
              </Button>
            </div>

            {visibility.shareUrl && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm font-mono break-all">
                  {visibility.shareUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(visibility.shareUrl!, 'Share link')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => visibility.shareUrl && window.open(visibility.shareUrl)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {visibility?.visibilityChangedAt && (
        <div className="text-xs text-muted-foreground text-center">
          Last changed: {new Date(visibility.visibilityChangedAt).toLocaleString()}
        </div>
      )}
    </div>
  )
}