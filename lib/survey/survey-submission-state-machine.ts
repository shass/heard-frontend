/**
 * Survey submission flow — finite state machine.
 * Replaces scattered boolean flags (isSubmittingFinalSurvey, isRedirecting)
 * with a single phase that represents the current submission state.
 */
export type SurveySubmissionPhase =
  | 'idle'               // No submission in progress
  | 'submitting_answer'  // Saving individual answer (non-final question)
  | 'submitting_final'   // Saving final answer + submitting entire survey
  | 'redirecting'        // Survey submitted, redirecting to results
  | 'error'              // Submission failed

export interface SubmissionPhaseConfig {
  showOverlay: boolean
  overlayMessage: string | null
  isBlocking: boolean
}

/** Static config per phase */
const PHASE_CONFIG: Record<SurveySubmissionPhase, SubmissionPhaseConfig> = {
  idle:              { showOverlay: false, overlayMessage: null,                       isBlocking: false },
  submitting_answer: { showOverlay: false, overlayMessage: null,                       isBlocking: false },
  submitting_final:  { showOverlay: true,  overlayMessage: 'Submitting survey...',     isBlocking: true  },
  redirecting:       { showOverlay: true,  overlayMessage: 'Redirecting to results...', isBlocking: true  },
  error:             { showOverlay: false, overlayMessage: null,                       isBlocking: false },
}

/** Get the UI config for a given submission phase. */
export function getSubmissionPhaseConfig(phase: SurveySubmissionPhase): SubmissionPhaseConfig {
  return PHASE_CONFIG[phase]
}
