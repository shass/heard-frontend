'use client'

import { useState, useCallback } from 'react'
import { bringid } from '@/lib/bringid'
import { bringIdApi } from '@/lib/api/bringid'

interface VerificationResult {
  verified: boolean
  points?: number
  error?: string
}

export function useHumanityVerification() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const verify = useCallback(async (walletAddress: string): Promise<VerificationResult> => {
    setIsVerifying(true)
    setResult(null)

    try {
      // Open BringId modal and get proofs and points
      const { proofs, points } = await bringid.verifyHumanity()

      // Send proofs AND points to backend for verification
      const response = await bringIdApi.verifyHumanity(walletAddress, proofs, points)

      const verificationResult: VerificationResult = {
        verified: response.verified,
        points: response.points ?? points,
      }

      setResult(verificationResult)
      return verificationResult
    } catch (error: any) {
      const errorResult: VerificationResult = {
        verified: false,
        error: error.message || 'Verification failed',
      }
      setResult(errorResult)
      return errorResult
    } finally {
      setIsVerifying(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setIsVerifying(false)
  }, [])

  return {
    isVerifying,
    result,
    verify,
    reset,
  }
}
