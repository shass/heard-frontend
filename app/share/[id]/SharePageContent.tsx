'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { ExternalLink, Loader2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { env } from '@/lib/env'
import type { Survey } from '@/lib/types'

interface SharePageContentProps {
  survey: Survey
}

export function SharePageContent({ survey }: SharePageContentProps) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [userAgent, setUserAgent] = useState('')

  useEffect(() => {
    // Get user agent on client side
    setUserAgent(navigator.userAgent.toLowerCase())

    // Auto-redirect logic
    const autoRedirect = () => {
      // Check if we're in a mobile app context (Base App or any mobile webview)
      const isMobileApp = /coinbase|wv|android.*version\/|iphone.*version\//i.test(navigator.userAgent)

      if (isMobileApp) {
        // Redirect to the actual survey page in the app
        setIsRedirecting(true)
        setTimeout(() => {
          router.push(`/surveys/${survey.id}/info`)
        }, 500)
      }
    }

    // Only auto-redirect if opened directly (not from a messenger preview)
    const isDirectOpen = document.referrer === '' || document.referrer.includes(window.location.hostname)
    if (isDirectOpen) {
      autoRedirect()
    }
  }, [survey.id, router])

  const handleOpenInApp = () => {
    // Create Base App deeplink
    const surveyUrl = `${env.PUBLIC_URL}/surveys/${survey.id}/info`
    const deeplink = `cbwallet://miniapp?url=${encodeURIComponent(surveyUrl)}`

    setIsRedirecting(true)

    // Try to open deeplink
    window.location.href = deeplink

    // Fallback: if deeplink doesn't work, redirect to web version
    setTimeout(() => {
      router.push(`/surveys/${survey.id}/info`)
    }, 2000)
  }

  const handleOpenInBrowser = () => {
    router.push(`/surveys/${survey.id}/info`)
  }

  const formatReward = () => {
    const tokenReward = `${formatNumber(survey.rewardAmount)} ${survey.rewardToken}`
    const pointsReward = survey.heardPointsReward > 0
      ? ` + ${formatNumber(survey.heardPointsReward)} HP`
      : ''
    return tokenReward + pointsReward
  }

  // Show loading state during redirect
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-zinc-900" />
          <p className="text-zinc-600">Opening survey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            HEARD Survey
          </h1>
          <p className="text-zinc-600">Everyone Will Be HEARD</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{survey.name}</CardTitle>
            <CardDescription className="text-lg">{survey.company}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-sm text-zinc-600 mb-1">Reward</div>
              <div className="text-2xl font-bold text-zinc-900">
                {formatReward()}
              </div>
            </div>

            <div>
              <div className="text-sm text-zinc-600 mb-1">Questions</div>
              <div className="text-lg text-zinc-900">{survey.totalQuestions} questions</div>
            </div>

            {survey.description && (
              <div>
                <div className="text-sm text-zinc-600 mb-1">Description</div>
                <p className="text-zinc-900">{survey.description}</p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleOpenInApp}
                size="lg"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open in Base App
              </Button>

              <Button
                onClick={handleOpenInBrowser}
                size="lg"
                variant="outline"
                className="w-full"
              >
                Open in Browser
              </Button>
            </div>

            <div className="text-xs text-zinc-500 text-center pt-4">
              Share this link with friends to invite them to take this survey
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-zinc-500">
          <p>Powered by HEARD</p>
          <p className="mt-1">
            <a
              href={env.PUBLIC_URL || 'https://heard.app'}
              className="text-zinc-700 hover:text-zinc-900 underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
