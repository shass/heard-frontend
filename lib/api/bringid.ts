// BringId API endpoints

import { apiClient } from './client'

export interface VerifyHumanityRequest {
  walletAddress: string
  proofs: unknown[]
  points: number
}

export interface VerifyHumanityResponse {
  verified: boolean
  points?: number
}

export class BringIdApi {
  /**
   * Verify humanity with BringId proofs
   */
  async verifyHumanity(
    walletAddress: string,
    proofs: unknown[],
    points: number
  ): Promise<VerifyHumanityResponse> {
    return apiClient.post<VerifyHumanityResponse>('/bringid/verify-humanity', {
      walletAddress,
      proofs,
      points,
    })
  }
}

// Export singleton instance
export const bringIdApi = new BringIdApi()
export default bringIdApi
