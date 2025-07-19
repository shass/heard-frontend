// TypeScript types for the application

// User types (compatible with backend)
export interface User {
  id: string
  walletAddress: string
  role: 'respondent' | 'admin' | 'survey_creator'
  herdPointsBalance: number
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

// Survey types (compatible with backend) 
export interface Survey {
  id: string
  name: string
  company: string
  description: string
  detailedDescription: string
  criteria: string
  rewardAmount: number
  rewardToken: string
  herdPointsReward: number
  totalQuestions: number
  responseCount: number
  isActive: boolean
  createdAt: string
}

// Question types
export interface Question {
  id: string
  questionText: string
  questionType: 'single' | 'multiple'
  order: number
  answers: Answer[]
  isRequired: boolean
}

export interface Answer {
  id: string
  text: string
  order: number
}

// Survey Response types
export interface SurveyResponse {
  id: string
  surveyId: string
  userId: string
  walletAddress: string
  responses: QuestionResponse[]
  completedAt?: string
  rewardClaimed: boolean
  linkDropCode?: string
  herdPointsAwarded: number
  createdAt: string
}

export interface QuestionResponse {
  questionId: string
  selectedAnswers: string[]
}

// HerdPoints Transaction types
export interface HerdPointsTransaction {
  id: string
  type: 'earned' | 'spent' | 'bonus' | 'admin_adjustment'
  amount: number
  description: string
  balanceBefore: number
  balanceAfter: number
  surveyId?: string
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  success: true
  data: T
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  meta: {
    timestamp: string
    requestId: string
  }
}

export interface PaginationMeta {
  limit: number
  offset: number
  total: number
  hasMore: boolean
}

// Authentication types
export interface AuthResponse {
  user: User
  token?: string // Optional for backward compatibility, HttpOnly cookie is preferred
  expiresAt: string
}

export interface NonceResponse {
  nonce: string
  message: string
}

// Eligibility types
export interface EligibilityResponse {
  isEligible: boolean
  hasStarted: boolean
  hasCompleted: boolean
  reason?: string
}

// Reward types  
export interface RewardInfo {
  amount: number
  token: string
  linkDropCode: string
  claimUrl: string
}

// App state types
export interface AppState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface SurveyState {
  surveys: Survey[]
  currentSurvey: Survey | null
  currentResponse: SurveyResponse | null
  loading: boolean
  error: string | null
}

// Form types
export interface ConnectWalletRequest {
  walletAddress: string
  signature: string
  message: string
}

export interface AnswerSubmissionRequest {
  responseId: string
  questionId: string
  selectedAnswers: string[]
}

// Utility types
export type ViewState = "home" | "survey" | "reward"

export type LoadingState = "idle" | "loading" | "success" | "error"

// Query state types
export interface QueryState<T> {
  data?: T
  loading: boolean
  error: string | null
  refetch: () => void
}

export interface MutationState {
  loading: boolean
  error: string | null
  success: boolean
}

export interface PaginatedQueryState<T> extends QueryState<T[]> {
  hasMore: boolean
  loadMore: () => void
  refreshing: boolean
}

// Loading component types
export interface LoadingComponentProps {
  loading?: boolean
  error?: string | null
  className?: string
  children?: React.ReactNode
}

export interface SkeletonProps {
  className?: string
  lines?: number
  width?: string | number
  height?: string | number
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Form state types
export interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  loading: boolean
  dirty: boolean
  valid: boolean
}

// Async operation state
export interface AsyncOperationState<T = any, E = string> {
  data?: T
  loading: boolean
  error?: E
  lastFetch?: Date
  stale: boolean
}

// Admin types
export interface AdminDashboardStats {
  totalSurveys: number
  activeSurveys: number
  totalResponses: number
  totalUsers: number
  monthlyResponses: number
  topSurveys: Array<{
    id: string
    name: string
    responseCount: number
    rewardAmount: number
  }>
}

export interface CreateSurveyRequest {
  name: string
  company: string
  description: string
  detailedDescription: string
  criteria: string
  rewardAmount: number
  rewardToken: string
  herdPointsReward: number
  questions: CreateQuestionRequest[]
  whitelist?: string[]
}

export interface CreateQuestionRequest {
  questionText: string
  questionType: 'single' | 'multiple'
  order: number
  answers: CreateAnswerRequest[]
  isRequired: boolean
}

export interface CreateAnswerRequest {
  text: string
  order: number
}

export interface UpdateSurveyRequest extends Partial<CreateSurveyRequest> {
  id: string
  isActive?: boolean
}

export interface WhitelistEntry {
  id: string
  surveyId: string
  walletAddress: string
  isActive: boolean
  createdAt: string
  createdBy: string
}

export interface WhitelistManagementData {
  surveyId: string
  entries: WhitelistEntry[]
  totalEntries: number
}

export interface BulkWhitelistRequest {
  surveyId: string
  walletAddresses: string[]
}

export interface AdminSurveyListItem extends Survey {
  whitelistCount: number
  eligibleUsers: number
  completionRate: number
  averageReward: number
}