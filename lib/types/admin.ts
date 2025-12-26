/**
 * Admin-specific types for wallet lookup and admin panel functionality
 */

/**
 * Response Status Enum
 * Matches backend ResponseStatus enum
 */
export enum ResponseStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Wallet Lookup Types
export interface WalletLookupUser {
  id: string
  walletAddress: string
  role: string
  heardPointsBalance: number
  createdAt: string
  lastLoginAt: string | null
}

export interface WalletSurveyReward {
  claimLink: string | null
  tokenAmount: number | null
  tokenAddress: string | null
  claimedAt: string | null
}

export interface WalletSurveyResponse {
  responseId: string
  surveyId: string
  surveyName: string
  surveyCompany: string
  status: ResponseStatus
  startedAt: string
  completedAt: string | null
  questionsAnswered: number
  totalQuestions: number
  heardPointsAwarded: number
  reward: WalletSurveyReward | null
}

export interface WalletLookupStats {
  totalSurveys: number
  completedSurveys: number
  inProgressSurveys: number
  totalHeardPointsEarned: number
}

export interface WalletLookupResponse {
  user: WalletLookupUser | null
  surveyResponses: WalletSurveyResponse[]
  stats: WalletLookupStats
}

export interface WalletResponseAnswer {
  questionId: string
  questionText: string
  questionType: string
  questionOrder: number
  selectedAnswers: Array<{
    id: string
    text: string
  }>
}

export interface WalletResponseDetails {
  responseId: string
  surveyId: string
  surveyName: string
  walletAddress: string
  status: ResponseStatus
  startedAt: string
  completedAt: string | null
  heardPointsAwarded: number
  answers: WalletResponseAnswer[]
}
