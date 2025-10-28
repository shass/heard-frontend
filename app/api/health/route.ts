import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

/**
 * Health check endpoint for monitoring and load balancer
 *
 * Checks:
 * - Node.js runtime availability
 * - Memory usage
 * - Backend API connectivity
 *
 * Returns 200 if healthy, 503 if unhealthy
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const checks = {
      nodejs: { status: 'ok', version: process.version },
      memory: { status: 'ok', usage: 0, total: 0, percentage: 0 },
      backend: { status: 'unknown', responseTime: 0 },
      uptime: process.uptime(),
    }

    // Check memory
    const memoryUsage = process.memoryUsage()
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const memoryPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)

    checks.memory = {
      status: memoryPercentage > 90 ? 'warning' : 'ok',
      usage: memoryUsedMB,
      total: memoryTotalMB,
      percentage: memoryPercentage,
    }

    // Check backend connectivity via surveys endpoint
    // Note: Backend doesn't have dedicated /health endpoint, so we test with /surveys
    try {
      const backendStartTime = Date.now()

      // Construct backend URL properly
      let backendUrl: string
      if (env.API_URL.startsWith('http')) {
        // API_URL is absolute (e.g., https://api.heard.app/api)
        backendUrl = `${env.API_URL}/surveys?limit=1`
      } else {
        // API_URL is relative (e.g., /api), need to construct full URL
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const host = request.headers.get('host')
        const baseUrl = host ? `${protocol}://${host}` : (env.PUBLIC_URL || 'http://localhost:3000')
        backendUrl = `${baseUrl}${env.API_URL}/surveys?limit=1`
      }

      const backendResponse = await fetch(backendUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      const backendResponseTime = Date.now() - backendStartTime

      checks.backend = {
        status: backendResponse.ok ? 'ok' : 'error',
        responseTime: backendResponseTime,
      }
    } catch (error) {
      checks.backend = {
        status: 'error',
        responseTime: 0,
      }
      console.error('[Health] Backend check failed:', error)
    }

    const responseTime = Date.now() - startTime
    const isHealthy = checks.nodejs.status === 'ok' &&
                      checks.memory.status !== 'error' &&
                      checks.backend.status === 'ok'

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime,
        checks,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          arch: process.arch,
        },
      },
      { status: isHealthy ? 200 : 503 }
    )
  } catch (error) {
    console.error('[Health] Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
