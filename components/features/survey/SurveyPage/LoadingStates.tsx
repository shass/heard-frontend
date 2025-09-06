import {
  SurveyErrorState,
  SurveyLoadingState,
  AuthRequiredState,
} from "@/components/survey"

interface LoadingStatesProps {
  isAuthenticated: boolean
  questionsLoading: boolean
  isCheckingProgress: boolean
  startSurveyPending: boolean
  isStarting: boolean
  responseId: string | null
  questionsError: Error | null
  questionsArrayLength: number
  onBack: () => void
}

export function LoadingStates({
  isAuthenticated,
  questionsLoading,
  isCheckingProgress,
  startSurveyPending,
  isStarting,
  responseId,
  questionsError,
  questionsArrayLength,
  onBack
}: LoadingStatesProps) {
  // Loading states
  if (!isAuthenticated) {
    return <AuthRequiredState onBack={onBack} />
  }

  if (questionsLoading) {
    return <SurveyLoadingState message="Loading survey questions..." />
  }

  // Show loading state while checking for incomplete responses
  if (isCheckingProgress) {
    return <SurveyLoadingState message="Checking for previous progress..." />
  }

  // Show starting state while survey is being started
  if ((startSurveyPending || isStarting) && !responseId) {
    return <SurveyLoadingState message="Starting survey..." />
  }

  if (questionsError || !questionsArrayLength) {
    const errorMessage = questionsError instanceof Error
      ? questionsError.message
      : 'Something went wrong'
    return (
      <SurveyErrorState
        title="Failed to load survey"
        message={errorMessage}
        onBack={onBack}
      />
    )
  }

  return null
}