import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

interface WarmupResult {
  url: string
  status: 'success' | 'error'
  statusCode?: number
  time: number
  error?: string
}

interface WarmupStats {
  total: number
  successful: number
  failed: number
  totalTime: number
  averageTime: number
}

/**
 * Warmup endpoint to pre-render critical pages after deployment
 *
 * This helps avoid cold starts by:
 * - Loading Node.js runtime and bundles into memory
 * - Pre-rendering SSR pages
 * - Warming up backend API connections
 *
 * Usage:
 * - GET /api/warmup - Warm up with default 20 surveys
 * - GET /api/warmup?limit=10 - Warm up with 10 surveys
 *
 * Security:
 * - Can be called from CI/CD after deployment
 * - Can be called manually for testing
 * - Add authentication if needed in production
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get limit parameter (default 20, max 50)
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50)
      : 20

    console.log(`[Warmup] Starting warmup with limit: ${limit}`)

    // Determine base URL for requests
    // On DigitalOcean App Platform, use the request URL if PUBLIC_URL is not set
    let baseUrl = env.PUBLIC_URL
    if (!baseUrl) {
      // Fallback: construct from request headers
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('host')
      baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000'
      console.log(`[Warmup] PUBLIC_URL not set, using: ${baseUrl}`)
    }

    const results: WarmupResult[] = []

    // Helper function to warm up a single URL
    const warmupUrl = async (url: string): Promise<WarmupResult> => {
      const urlStartTime = Date.now()
      try {
        console.log(`[Warmup] Warming up: ${url}`)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'HEARD-Warmup/1.0',
            'X-Warmup-Request': 'true',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout per page
        })

        const time = Date.now() - urlStartTime

        if (response.ok) {
          console.log(`[Warmup] ✅ ${url} - ${time}ms`)
          return {
            url,
            status: 'success',
            statusCode: response.status,
            time,
          }
        } else {
          console.log(`[Warmup] ❌ ${url} - ${response.status}`)
          return {
            url,
            status: 'error',
            statusCode: response.status,
            time,
            error: `HTTP ${response.status}`,
          }
        }
      } catch (error) {
        const time = Date.now() - urlStartTime
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Warmup] ❌ ${url} - ${errorMessage}`)

        return {
          url,
          status: 'error',
          time,
          error: errorMessage,
        }
      }
    }

    // 1. Warm up home page
    console.log('[Warmup] Step 1: Warming up home page')
    results.push(await warmupUrl(`${baseUrl}/`))

    // 2. Fetch active surveys from backend
    console.log('[Warmup] Step 2: Fetching active surveys from backend')
    let surveyIds: string[] = []

    try {
      const apiUrl = env.API_URL.startsWith('http')
        ? env.API_URL
        : `${baseUrl}${env.API_URL}`

      const surveysResponse = await fetch(
        `${apiUrl}/surveys?status=active&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'HEARD-Warmup/1.0',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }
      )

      if (surveysResponse.ok) {
        const surveysData = await surveysResponse.json()
        const surveys = surveysData.data || []
        surveyIds = surveys.map((survey: any) => survey._id || survey.id)
        console.log(`[Warmup] Found ${surveyIds.length} active surveys`)
      } else {
        console.warn(`[Warmup] Failed to fetch surveys: ${surveysResponse.status}`)
      }
    } catch (error) {
      console.error('[Warmup] Error fetching surveys:', error)
    }

    // 3. Warm up survey pages in parallel batches
    if (surveyIds.length > 0) {
      console.log(`[Warmup] Step 3: Warming up ${surveyIds.length} survey pages`)

      // Create array of all URLs to warm up
      const surveyUrls: string[] = []
      for (const surveyId of surveyIds) {
        surveyUrls.push(`${baseUrl}/surveys/${surveyId}/info`)
        surveyUrls.push(`${baseUrl}/surveys/${surveyId}`)
      }

      // Warm up in parallel batches of 5 to avoid overwhelming the server
      const batchSize = 5
      for (let i = 0; i < surveyUrls.length; i += batchSize) {
        const batch = surveyUrls.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map(warmupUrl))
        results.push(...batchResults)

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < surveyUrls.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }
    } else {
      console.log('[Warmup] No surveys to warm up')
    }

    // Calculate statistics
    const totalTime = Date.now() - startTime
    const successful = results.filter((r) => r.status === 'success').length
    const failed = results.filter((r) => r.status === 'error').length
    const totalRequestTime = results.reduce((sum, r) => sum + r.time, 0)
    const averageTime = results.length > 0 ? Math.round(totalRequestTime / results.length) : 0

    const stats: WarmupStats = {
      total: results.length,
      successful,
      failed,
      totalTime,
      averageTime,
    }

    console.log(`[Warmup] Completed: ${successful}/${results.length} successful in ${totalTime}ms`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      results,
      config: {
        limit,
        surveysFound: surveyIds.length,
        pagesWarmedUp: results.length,
      },
    })
  } catch (error) {
    console.error('[Warmup] Warmup failed:', error)

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
