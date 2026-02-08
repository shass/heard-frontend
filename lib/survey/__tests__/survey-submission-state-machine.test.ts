import {
  type SurveySubmissionPhase,
  getSubmissionPhaseConfig,
} from '../survey-submission-state-machine'

const ALL_PHASES: SurveySubmissionPhase[] = [
  'idle',
  'submitting_answer',
  'submitting_final',
  'redirecting',
  'error',
]

describe('getSubmissionPhaseConfig', () => {
  it('returns config for every phase without throwing', () => {
    for (const phase of ALL_PHASES) {
      expect(() => getSubmissionPhaseConfig(phase)).not.toThrow()
    }
  })

  it('idle — no overlay, not blocking', () => {
    const config = getSubmissionPhaseConfig('idle')
    expect(config.showOverlay).toBe(false)
    expect(config.overlayMessage).toBeNull()
    expect(config.isBlocking).toBe(false)
  })

  it('submitting_answer — no overlay, not blocking (save indicator handles this)', () => {
    const config = getSubmissionPhaseConfig('submitting_answer')
    expect(config.showOverlay).toBe(false)
    expect(config.overlayMessage).toBeNull()
    expect(config.isBlocking).toBe(false)
  })

  it('submitting_final — overlay with message, blocking', () => {
    const config = getSubmissionPhaseConfig('submitting_final')
    expect(config.showOverlay).toBe(true)
    expect(config.overlayMessage).toBe('Submitting survey...')
    expect(config.isBlocking).toBe(true)
  })

  it('redirecting — overlay with message, blocking', () => {
    const config = getSubmissionPhaseConfig('redirecting')
    expect(config.showOverlay).toBe(true)
    expect(config.overlayMessage).toBe('Redirecting to results...')
    expect(config.isBlocking).toBe(true)
  })

  it('error — no overlay, not blocking', () => {
    const config = getSubmissionPhaseConfig('error')
    expect(config.showOverlay).toBe(false)
    expect(config.overlayMessage).toBeNull()
    expect(config.isBlocking).toBe(false)
  })

  it('only submitting_final and redirecting show overlay', () => {
    for (const phase of ALL_PHASES) {
      const config = getSubmissionPhaseConfig(phase)
      if (phase === 'submitting_final' || phase === 'redirecting') {
        expect(config.showOverlay).toBe(true)
      } else {
        expect(config.showOverlay).toBe(false)
      }
    }
  })

  it('only submitting_final and redirecting are blocking', () => {
    for (const phase of ALL_PHASES) {
      const config = getSubmissionPhaseConfig(phase)
      if (phase === 'submitting_final' || phase === 'redirecting') {
        expect(config.isBlocking).toBe(true)
      } else {
        expect(config.isBlocking).toBe(false)
      }
    }
  })
})
