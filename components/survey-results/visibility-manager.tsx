'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Eye,
  EyeOff,
  Globe,
  Link,
  Lock,
  Share2,
  Copy,
  Settings,
  Info
} from 'lucide-react'
import { useCompatibleAuth } from '@/src/platforms'
import {
  useSurveyVisibility,
  useUpdateSurveyVisibility,
  useGenerateShareLink
} from '@/hooks/use-survey-clients'
import { toast } from 'sonner'

interface VisibilityManagerProps {
  surveyId: string
}

export function VisibilityManager({ surveyId }: VisibilityManagerProps) {
  const { user } = useCompatibleAuth()
  const isAdmin = user?.role === 'admin'

  const { data: visibility, isLoading } = useSurveyVisibility(surveyId)
  const updateVisibility = useUpdateSurveyVisibility()
  const generateLink = useGenerateShareLink()

  // Only show for admins
  if (!isAdmin) {
    return null
  }

  if (isLoading || !visibility) {
    return null
  }

  const handleVisibilityChange = async (newMode: 'private' | 'public' | 'link') => {
    try {
      await updateVisibility.mutateAsync({
        surveyId,
        request: { visibilityMode: newMode }
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleGenerateLink = async () => {
    try {
      await generateLink.mutateAsync(surveyId)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    }
  }

  const getResultsUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/surveys/${surveyId}/results`
    }
    return `/surveys/${surveyId}/results`
  }

  const getVisibilityIcon = (mode: string) => {
    switch (mode) {
      case 'public': return <Globe className="h-4 w-4" />
      case 'link': return <Link className="h-4 w-4" />
      default: return <Lock className="h-4 w-4" />
    }
  }

  const getVisibilityDescription = (mode: string) => {
    switch (mode) {
      case 'public':
        return 'Anyone can view the survey results without authentication'
      case 'link':
        return 'Results can be accessed via a special shareable link'
      default:
        return 'Only administrators and survey clients can view results'
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Survey Visibility Management
          <Badge variant="outline" className="ml-auto">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {getVisibilityIcon(visibility.visibilityMode)}
            <div>
              <div className="font-medium capitalize">
                {visibility.visibilityMode} Access
              </div>
              <div className="text-sm text-muted-foreground">
                {getVisibilityDescription(visibility.visibilityMode)}
              </div>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Survey Visibility</DialogTitle>
                <DialogDescription>
                  Choose who can view the survey results
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Changing visibility will affect who can access the survey results immediately.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {/* Private Option */}
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      visibility.visibilityMode === 'private' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleVisibilityChange('private')}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">Private</div>
                        <div className="text-sm text-muted-foreground">
                          Only admins and survey clients can view
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Public Option */}
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      visibility.visibilityMode === 'public' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleVisibilityChange('public')}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">Public</div>
                        <div className="text-sm text-muted-foreground">
                          Anyone can view without authentication
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Link Option */}
                  <div
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      visibility.visibilityMode === 'link' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleVisibilityChange('link')}
                  >
                    <div className="flex items-center gap-3">
                      <Link className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">Link Access</div>
                        <div className="text-sm text-muted-foreground">
                          Accessible via special shareable link
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Results Link Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Survey Results Link</h4>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <code className="flex-1 text-sm font-mono truncate">
              {getResultsUrl()}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(getResultsUrl())}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Share Link Section */}
        {visibility.visibilityMode === 'link' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Share Link</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateLink}
                disabled={generateLink.isPending}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {visibility.shareUrl ? 'Regenerate' : 'Generate'} Link
              </Button>
            </div>

            {visibility.shareUrl && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <code className="flex-1 text-sm font-mono truncate">
                  {visibility.shareUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(visibility.shareUrl!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Public Access Info */}
        {visibility.visibilityMode === 'public' && (
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              This survey's results are publicly accessible. Anyone with the URL can view the results.
            </AlertDescription>
          </Alert>
        )}

        {/* Last Changed Info */}
        {visibility.visibilityChangedAt && (
          <div className="text-xs text-muted-foreground">
            Last changed: {new Date(visibility.visibilityChangedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
