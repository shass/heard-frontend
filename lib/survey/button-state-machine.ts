import { SurveyType } from '@/lib/types'

/**
 * Survey action button phases — finite state machine.
 * Priority-ordered: higher in the list = checked first.
 */
export type SurveyButtonPhase =
  | 'resolving'
  | 'completed'
  | 'check_results'
  | 'connect_wallet'
  | 'checking_eligibility'
  | 'eligibility_error'
  | 'not_eligible'
  | 'verify_bringid'
  | 'verifying_bringid'
  | 'not_started_yet'
  | 'ended'
  | 'authenticate'
  | 'authenticating'
  | 'start'
  | 'continue'

export interface SurveyButtonInput {
  surveyLoaded: boolean
  surveyType: SurveyType
  startDate?: string | Date
  endDate?: string | Date

  eligibility: {
    isEligible: boolean
    hasStarted: boolean
    hasCompleted: boolean
    accessStrategies?: Record<string, {
      passed: boolean
      requiresHumanityVerification?: boolean
    }>
  } | undefined
  isEligibilityFetching: boolean
  isEligibilityError: boolean

  isConnected: boolean
  hasAddress: boolean
  isAuthenticated: boolean
  isAuthLoading: boolean
  isBringIdVerifying: boolean
}

export interface ButtonState {
  text: string
  disabled: boolean
  loading: boolean
  handler: () => void
}

export interface SurveyButtonHandlers {
  onStart: () => void
  onConnect: () => void
  onAuthenticate: () => Promise<void>
  onVerifyBringId?: () => void
}

function isPast(date?: string | Date): boolean {
  if (!date) return false
  return new Date() >= new Date(date)
}

/**
 * Resolve the current button phase from all input signals.
 * Pure function — no side effects, easily testable.
 */
export function resolveSurveyButtonPhase(input: SurveyButtonInput): SurveyButtonPhase {
  // 1. Survey data not loaded yet
  if (!input.surveyLoaded) return 'resolving'

  // 2. Survey completed — terminal state
  if (input.eligibility?.hasCompleted) {
    // Prediction special case: ended + completed + connected but not auth'd → need to sign to see results
    if (
      input.surveyType === SurveyType.PREDICTION &&
      isPast(input.endDate) &&
      input.isConnected &&
      !input.isAuthenticated
    ) {
      return input.isAuthLoading ? 'authenticating' : 'check_results'
    }
    return 'completed'
  }

  // 3. Wallet not connected
  if (!input.isConnected) return 'connect_wallet'

  // 4. Eligibility check in flight
  if (input.isEligibilityFetching && input.hasAddress) return 'checking_eligibility'

  // 5. Eligibility resolved: not eligible
  if (input.eligibility && !input.eligibility.isEligible) {
    // Check if any strategy requires humanity verification (actionable by user)
    const bringIdResult = input.eligibility.accessStrategies?.bringid
    if (bringIdResult && !bringIdResult.passed && bringIdResult.requiresHumanityVerification) {
      return input.isBringIdVerifying ? 'verifying_bringid' : 'verify_bringid'
    }
    return 'not_eligible'
  }

  // 6. Time gates (apply to all survey types)
  if (input.startDate && !isPast(input.startDate)) return 'not_started_yet'
  if (input.endDate && isPast(input.endDate)) return 'ended'

  // 7. Not authenticated — need to sign
  if (!input.isAuthenticated) {
    return input.isAuthLoading ? 'authenticating' : 'authenticate'
  }

  // 8. Eligibility check failed
  if (!input.eligibility && input.isEligibilityError) return 'eligibility_error'

  // 9. No eligibility data and not fetching — still resolving
  if (!input.eligibility) return 'resolving'

  // 10. Ready
  return input.eligibility.hasStarted ? 'continue' : 'start'
}

/** Static button config per phase (text, disabled, loading) */
const PHASE_CONFIG: Record<SurveyButtonPhase, { text: string; disabled: boolean; loading: boolean }> = {
  resolving:            { text: 'Loading...',                disabled: true,  loading: true  },
  completed:            { text: 'Survey Completed',          disabled: true,  loading: false },
  check_results:        { text: 'Sign to check your results', disabled: false, loading: false },
  connect_wallet:       { text: 'Connect Wallet',            disabled: false, loading: false },
  checking_eligibility: { text: 'Checking eligibility...',   disabled: true,  loading: true  },
  eligibility_error:    { text: 'Eligibility Check Failed', disabled: true,  loading: false },
  not_eligible:         { text: 'Not Eligible',              disabled: true,  loading: false },
  verify_bringid:       { text: 'Verify with BringId',       disabled: false, loading: false },
  verifying_bringid:    { text: 'Verifying...',              disabled: true,  loading: true  },
  not_started_yet:      { text: 'Survey Not Started Yet',    disabled: true,  loading: false },
  ended:                { text: 'Survey Ended',              disabled: true,  loading: false },
  authenticate:         { text: 'Authorize & Start Survey',  disabled: false, loading: false },
  authenticating:       { text: 'Authenticating...',         disabled: true,  loading: true  },
  start:                { text: 'Start Survey',              disabled: false, loading: false },
  continue:             { text: 'Continue',                  disabled: false, loading: false },
}

/** Handler assignment per phase */
const PHASE_HANDLER_KEY: Record<SurveyButtonPhase, keyof SurveyButtonHandlers | null> = {
  resolving:            null,
  completed:            null,
  check_results:        'onAuthenticate',
  connect_wallet:       'onConnect',
  checking_eligibility: null,
  eligibility_error:    null,
  not_eligible:         null,
  verify_bringid:       'onVerifyBringId',
  verifying_bringid:    null,
  not_started_yet:      null,
  ended:                null,
  authenticate:         'onAuthenticate',
  authenticating:       'onAuthenticate',
  start:                'onStart',
  continue:             'onStart',
}

/**
 * Map a resolved phase + handlers into a ButtonState for rendering.
 */
export function getButtonConfig(phase: SurveyButtonPhase, handlers: SurveyButtonHandlers): ButtonState {
  const config = PHASE_CONFIG[phase]
  const handlerKey = PHASE_HANDLER_KEY[phase]
  const handler = handlerKey ? (handlers[handlerKey] as (() => void)) ?? (() => {}) : () => {}

  return { ...config, handler }
}
