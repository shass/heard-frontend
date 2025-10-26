import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { env } from '@/lib/env'
import { SharePageContent } from './SharePageContent'

interface SharePageProps {
  params: { id: string }
}

// Helper to get absolute API URL for server-side fetching
function getAbsoluteApiUrl(path: string): string {
  const apiUrl = env.API_URL

  // If API_URL is already absolute (starts with http:// or https://), use it directly
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return `${apiUrl}${path}`
  }

  // Otherwise API_URL is relative (like /api), so prepend PUBLIC_URL
  const baseUrl = env.PUBLIC_URL || 'http://localhost:3000'
  return `${baseUrl}${apiUrl}${path}`
}

// Generate metadata for social sharing (OpenGraph)
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const surveyId = params.id

  try {
    // Fetch survey data for metadata
    const response = await fetch(getAbsoluteApiUrl(`/surveys/${surveyId}`), {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      return {
        title: 'HEARD Survey',
        description: 'Take surveys and earn crypto rewards on HEARD',
      }
    }

    const data = await response.json()
    const survey = data.data

    const title = `${survey.name} - HEARD Survey`
    const description = `Take this survey from ${survey.company} and earn ${survey.rewardAmount} ${survey.rewardToken}${survey.heardPointsReward > 0 ? ` + ${survey.heardPointsReward} HeardPoints` : ''}. Everyone will be HEARD!`
    const shareUrl = `${env.PUBLIC_URL}/share/${surveyId}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: shareUrl,
        siteName: 'HEARD',
        images: [
          {
            url: `${env.PUBLIC_URL}/hero-1200x630.png`,
            width: 1200,
            height: 630,
            alt: 'HEARD - Everyone Will Be HEARD',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`${env.PUBLIC_URL}/hero-1200x630.png`],
      },
      // Additional meta tags for better sharing
      alternates: {
        canonical: shareUrl,
      },
    }
  } catch (error) {
    console.error('[SharePage] Failed to generate metadata:', error)
    return {
      title: 'HEARD Survey',
      description: 'Take surveys and earn crypto rewards on HEARD',
    }
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const surveyId = params.id

  try {
    // Fetch survey data server-side
    const response = await fetch(getAbsoluteApiUrl(`/surveys/${surveyId}`), {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      notFound()
    }

    const data = await response.json()
    const survey = data.data

    return <SharePageContent survey={survey} />
  } catch (error) {
    console.error('[SharePage] Failed to fetch survey:', error)
    notFound()
  }
}
