import { resolveSurveyButtonPhase, getButtonConfig, SurveyButtonInput } from '../button-state-machine'
import { SurveyType } from '@/lib/types'

const defaultInput: SurveyButtonInput = {
  surveyLoaded: true,
  surveyType: SurveyType.STANDARD,
  eligibility: { isEligible: true, hasStarted: false, hasCompleted: false },
  isEligibilityFetching: false,
  isEligibilityError: false,
  isConnected: true,
  hasAddress: true,
  isAuthenticated: true,
  isAuthLoading: false,
  isBringIdVerifying: false,
}

function input(overrides: Partial<SurveyButtonInput>): SurveyButtonInput {
  return { ...defaultInput, ...overrides }
}

describe('resolveSurveyButtonPhase', () => {
  it('returns resolving when survey not loaded', () => {
    expect(resolveSurveyButtonPhase(input({ surveyLoaded: false }))).toBe('resolving')
  })

  it('returns resolving when no eligibility data and not fetching', () => {
    expect(resolveSurveyButtonPhase(input({ eligibility: undefined }))).toBe('resolving')
  })

  it('returns completed when survey is completed', () => {
    expect(
      resolveSurveyButtonPhase(
        input({ eligibility: { isEligible: true, hasStarted: true, hasCompleted: true } }),
      ),
    ).toBe('completed')
  })

  it('returns check_results for ended prediction completed by unauthenticated user', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          surveyType: SurveyType.PREDICTION,
          endDate: '2020-01-01',
          eligibility: { isEligible: true, hasStarted: true, hasCompleted: true },
          isAuthenticated: false,
        }),
      ),
    ).toBe('check_results')
  })

  it('returns connect_wallet when not connected', () => {
    expect(resolveSurveyButtonPhase(input({ isConnected: false }))).toBe('connect_wallet')
  })

  it('returns checking_eligibility when eligibility is fetching', () => {
    expect(
      resolveSurveyButtonPhase(
        input({ isEligibilityFetching: true, eligibility: undefined }),
      ),
    ).toBe('checking_eligibility')
  })

  it('returns not_eligible when ineligible without BringId', () => {
    expect(
      resolveSurveyButtonPhase(
        input({ eligibility: { isEligible: false, hasStarted: false, hasCompleted: false } }),
      ),
    ).toBe('not_eligible')
  })

  it('returns verify_bringid when ineligible with BringId requiring humanity verification', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          eligibility: {
            isEligible: false,
            hasStarted: false,
            hasCompleted: false,
            accessStrategies: {
              bringid: { passed: false, requiresHumanityVerification: true },
            },
          },
        }),
      ),
    ).toBe('verify_bringid')
  })

  it('returns not_eligible when ineligible with BringId that passed', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          eligibility: {
            isEligible: false,
            hasStarted: false,
            hasCompleted: false,
            accessStrategies: {
              bringid: { passed: true },
            },
          },
        }),
      ),
    ).toBe('not_eligible')
  })

  it('returns not_eligible when ineligible with BringId that does not require verification', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          eligibility: {
            isEligible: false,
            hasStarted: false,
            hasCompleted: false,
            accessStrategies: {
              bringid: { passed: false },
            },
          },
        }),
      ),
    ).toBe('not_eligible')
  })

  it('returns not_eligible when accessStrategies contains only non-bringid entries', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          eligibility: {
            isEligible: false,
            hasStarted: false,
            hasCompleted: false,
            accessStrategies: {
              whitelist: { passed: false },
            },
          },
        }),
      ),
    ).toBe('not_eligible')
  })

  it('returns verifying_bringid when BringId verification in progress', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          eligibility: {
            isEligible: false,
            hasStarted: false,
            hasCompleted: false,
            accessStrategies: {
              bringid: { passed: false, requiresHumanityVerification: true },
            },
          },
          isBringIdVerifying: true,
        }),
      ),
    ).toBe('verifying_bringid')
  })

  it('returns not_started_yet for prediction before start date', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          surveyType: SurveyType.PREDICTION,
          startDate: new Date(Date.now() + 86400000).toISOString(),
        }),
      ),
    ).toBe('not_started_yet')
  })

  it('returns ended for prediction after end date', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          surveyType: SurveyType.PREDICTION,
          endDate: '2020-01-01',
        }),
      ),
    ).toBe('ended')
  })

  it('returns authenticate when not authenticated', () => {
    expect(
      resolveSurveyButtonPhase(input({ isAuthenticated: false })),
    ).toBe('authenticate')
  })

  it('returns authenticating when auth is loading', () => {
    expect(
      resolveSurveyButtonPhase(input({ isAuthenticated: false, isAuthLoading: true })),
    ).toBe('authenticating')
  })

  it('returns start for eligible authenticated user who has not started', () => {
    expect(resolveSurveyButtonPhase(defaultInput)).toBe('start')
  })

  it('returns continue for eligible authenticated user who has started', () => {
    expect(
      resolveSurveyButtonPhase(
        input({ eligibility: { isEligible: true, hasStarted: true, hasCompleted: false } }),
      ),
    ).toBe('continue')
  })

  // Priority tests
  it('completed takes priority over connect_wallet and not_eligible', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          eligibility: { isEligible: false, hasStarted: true, hasCompleted: true },
          isConnected: false,
          isAuthenticated: false,
        }),
      ),
    ).toBe('completed')
  })

  it('connect_wallet takes priority over eligibility', () => {
    expect(
      resolveSurveyButtonPhase(
        input({
          isConnected: false,
          eligibility: { isEligible: false, hasStarted: false, hasCompleted: false },
        }),
      ),
    ).toBe('connect_wallet')
  })
})

describe('getButtonConfig', () => {
  const handlers = {
    onStart: jest.fn(),
    onConnect: jest.fn(),
    onAuthenticate: jest.fn(),
    onVerifyBringId: jest.fn(),
  }

  it('maps start phase to correct text', () => {
    const config = getButtonConfig('start', handlers)
    expect(config.text).toBe('Start Survey')
    expect(config.disabled).toBe(false)
    expect(config.loading).toBe(false)
  })

  it('maps connect_wallet phase to onConnect handler', () => {
    const config = getButtonConfig('connect_wallet', handlers)
    expect(config.handler).toBe(handlers.onConnect)
  })

  it('disabled phases have noop handler that does not throw', () => {
    const config = getButtonConfig('completed', handlers)
    expect(() => config.handler()).not.toThrow()
  })
})
