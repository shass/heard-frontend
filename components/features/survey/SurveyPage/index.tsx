"use client"

import React from "react"
import type { Survey } from "@/lib/types"
import { useSurveyPage } from "./hooks/useSurveyPage"
import { LoadingStates } from "./LoadingStates"
import { LoadingOverlay } from "./LoadingOverlay"
import { SurveyContent } from "./SurveyContent"

interface SurveyPageProps {
  survey: Survey
  onSubmit: (responseId?: string) => void
  onBack: () => void
}

export function SurveyPage({ survey, onSubmit, onBack }: SurveyPageProps) {
  const {
    // State
    currentQuestionIndex,
    answers,
    responseId,
    saveStatus,
    isStarting,
    isCheckingProgress,
    submissionPhase,
    submissionPhaseConfig,
    isAuthenticated,

    // Data
    questionsLoading,
    questionsError,
    questionsArray,
    currentQuestion,
    progress,

    // Computed values
    canProceed,
    isLastQuestion,
    shouldShowOverlay,
    overlayMessage,

    // Mutations
    startSurvey,
    responseState,

    // Handlers
    handleAnswerChange,
    handleNext,
    handlePrevious
  } = useSurveyPage({ survey, onSubmit })

  // Check for loading states that should replace the entire component
  if (!isAuthenticated) {
    return <LoadingStates
      isAuthenticated={isAuthenticated}
      questionsLoading={questionsLoading}
      isCheckingProgress={isCheckingProgress}
      startSurveyPending={startSurvey.isPending}
      isStarting={isStarting}
      responseId={null}
      questionsError={questionsError}
      questionsArrayLength={questionsArray.length}
      onBack={onBack}
    />
  }

  if (questionsLoading || isCheckingProgress || ((startSurvey.isPending || isStarting) && !responseId)) {
    return <LoadingStates
      isAuthenticated={isAuthenticated}
      questionsLoading={questionsLoading}
      isCheckingProgress={isCheckingProgress}
      startSurveyPending={startSurvey.isPending}
      isStarting={isStarting}
      responseId={null}
      questionsError={questionsError}
      questionsArrayLength={questionsArray.length}
      onBack={onBack}
    />
  }

  if (questionsError || !questionsArray.length) {
    return <LoadingStates
      isAuthenticated={isAuthenticated}
      questionsLoading={questionsLoading}
      isCheckingProgress={isCheckingProgress}
      startSurveyPending={startSurvey.isPending}
      isStarting={isStarting}
      responseId={null}
      questionsError={questionsError}
      questionsArrayLength={questionsArray.length}
      onBack={onBack}
    />
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <section className="w-full py-16 relative">
      <SurveyContent
        survey={survey}
        saveStatus={saveStatus}
        currentQuestionIndex={currentQuestionIndex}
        questionsArray={questionsArray}
        progress={progress}
        currentQuestion={currentQuestion}
        answers={answers}
        canProceed={canProceed}
        isLastQuestion={isLastQuestion}
        isSubmitting={submissionPhaseConfig.isBlocking || responseState.isSubmittingAnswer}
        onBack={onBack}
        onAnswerChange={handleAnswerChange}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      <LoadingOverlay 
        shouldShow={shouldShowOverlay} 
        message={overlayMessage} 
      />
    </section>
  )
}