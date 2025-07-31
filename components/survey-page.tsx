"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSurveyQuestions, useStartSurvey } from "@/hooks/use-surveys"
import { useSurveyResponseState, useAnswerValidation } from "@/hooks/use-survey-response"
import { useIsAuthenticated } from "@/lib/store"
import { useNotifications } from "@/components/ui/notifications"
import { surveyApi } from "@/lib/api/surveys"
import {
  SurveyHeader,
  SurveyProgressBar,
  QuestionCard,
  SurveyNavigation,
  SurveyErrorState,
  SurveyLoadingState,
  AuthRequiredState,
  type SaveStatus
} from "@/components/survey"
import type { Survey } from "@/lib/types"

interface SurveyPageProps {
  survey: Survey
  onSubmit: (responseId?: string) => void
  onBack: () => void
}

export function SurveyPage({ survey, onSubmit, onBack }: SurveyPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [responseId, setResponseId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isStarting, setIsStarting] = useState(false)
  const [isCheckingProgress, setIsCheckingProgress] = useState(false)
  const [isSubmittingFinalSurvey, setIsSubmittingFinalSurvey] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const hasStarted = useRef(false)
  const hasCheckedProgress = useRef(false)

  const isAuthenticated = useIsAuthenticated()
  const notifications = useNotifications()

  // Load survey questions
  const {
    data: questionsData,
    isLoading: questionsLoading,
    error: questionsError
  } = useSurveyQuestions(survey.id)

  // Extract questions from API response
  const questions = questionsData?.questions || []

  // Start survey mutation with callbacks
  const startSurvey = useStartSurvey({
    onSuccess: (data) => {
      setResponseId(data?.responseId || '')
      setIsStarting(false)
      notifications?.success('Survey started', 'Your progress will be saved automatically')
    },
    onError: (error: any) => {
      hasStarted.current = false
      setIsStarting(false)
      notifications?.error('Failed to start survey', error?.message || 'Unknown error')
    }
  })

  // Response state management (only after we have a responseId)
  // Disable progress and response queries since we manage state locally
  const responseState = useSurveyResponseState(responseId || null, {
    enableProgress: false,
    enableResponse: false
  })


  // Answer validation
  const { validateRequired, validateSingleChoice } = useAnswerValidation()

  const currentQuestion = Array.isArray(questions) ? questions[currentQuestionIndex] : undefined
  const questionsArray = Array.isArray(questions) ? questions : []
  
  // Calculate progress based on submitted answers (questions that have been processed via Next/Submit)
  // Progress should only update after successful submission, not on answer selection
  const submittedQuestionsCount = currentQuestionIndex
  const progress = questionsArray.length > 0 ? (submittedQuestionsCount / questionsArray.length) * 100 : 0

  // Clear survey state when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear survey state when user logs out or wallet changes
      setAnswers({})
      setResponseId(null)
      setSaveStatus('idle')
      setIsStarting(false)
      setIsCheckingProgress(false)
      setIsSubmittingFinalSurvey(false)
      setIsRedirecting(false)
      hasStarted.current = false
      hasCheckedProgress.current = false
      setCurrentQuestionIndex(0)
    }
  }, [isAuthenticated])

  // Check for incomplete survey responses when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasCheckedProgress.current && !responseId && !isCheckingProgress) {
      hasCheckedProgress.current = true
      setIsCheckingProgress(true)

      surveyApi.getUserSurveyProgress(survey.id)
        .then((progressData) => {
          if (progressData.hasCompletedResponse) {
            // User has already completed this survey, redirect to results
            notifications?.info('Survey already completed', 'Redirecting to your results...')
            onSubmit() // This will redirect to reward page
            return
          }
          
          if (progressData.hasIncompleteResponse && progressData.progress) {
            // User has an incomplete response, resume from where they left off
            setResponseId(progressData.progress.responseId)
            setCurrentQuestionIndex(progressData.progress.currentQuestionOrder - 1) // Convert to 0-based index

            // Load previous answers
            if (progressData.progress.responses) {
              const previousAnswers: Record<string, string[]> = {}
              progressData.progress.responses.forEach(response => {
                previousAnswers[response.questionId] = response.selectedAnswers
              })
              setAnswers(previousAnswers)
            }

            notifications?.success('Resuming survey', 'Continuing from where you left off')
          }
        })
        .catch((error) => {
          console.warn('Failed to check survey progress:', error)
          // Don't show error to user, just continue with normal flow
        })
        .finally(() => {
          setIsCheckingProgress(false)
        })
    }
  }, [isAuthenticated, survey.id, responseId, isCheckingProgress, notifications])

  // Start survey when component mounts or authentication is restored (only if no incomplete response)
  useEffect(() => {
    if (isAuthenticated && !responseId && !isStarting && !startSurvey.isPending && !hasStarted.current && !isCheckingProgress && hasCheckedProgress.current) {
      hasStarted.current = true
      setIsStarting(true)
      startSurvey.mutate({ id: survey.id })
    }
  }, [isAuthenticated, survey.id, isCheckingProgress, hasCheckedProgress.current])

  const handleAnswerChange = (questionId: string, answer: string, isMultiple: boolean = false) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev }

      if (isMultiple) {
        // Handle multiple choice
        const currentAnswers = newAnswers[questionId] || []
        if (currentAnswers.includes(answer)) {
          // Remove if already selected
          newAnswers[questionId] = currentAnswers.filter(a => a !== answer)
        } else {
          // Add to selection
          newAnswers[questionId] = [...currentAnswers, answer]
        }
      } else {
        // Handle single choice
        newAnswers[questionId] = [answer]
      }

      return newAnswers
    })
  }

  const handleNext = async () => {
    if (!currentQuestion || !responseId) return

    // Check if this is the last question and set blocking state immediately
    const isLastQuestion = currentQuestionIndex === questionsArray.length - 1
    if (isLastQuestion) {
      setIsSubmittingFinalSurvey(true)
    }

    // Validate current answer
    const selectedAnswers = answers[currentQuestion.id] || []
    const requiredValidation = validateRequired(currentQuestion, selectedAnswers)
    const singleChoiceValidation = validateSingleChoice(currentQuestion, selectedAnswers)

    if (!requiredValidation.isValid) {
      notifications.error('Answer required', requiredValidation.error!)
      if (isLastQuestion) setIsSubmittingFinalSurvey(false) // Reset if validation failed
      return
    }

    if (!singleChoiceValidation.isValid) {
      notifications.error('Invalid selection', singleChoiceValidation.error!)
      if (isLastQuestion) setIsSubmittingFinalSurvey(false) // Reset if validation failed
      return
    }

    // Save answer before proceeding
    setSaveStatus('saving')

    try {
      await responseState.submitAnswer({
        responseId,
        questionId: currentQuestion.id,
        selectedAnswers
      })

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)

      if (currentQuestionIndex < questionsArray.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // Submit completed survey - blocking state already set at the beginning
        console.log('Submitting completed survey with responseId:', responseId)
        try {
          await responseState.submitSurvey({ responseId })
          console.log('Survey submitted successfully')
          setIsRedirecting(true) // Keep UI blocked during redirect
          onSubmit(responseId)
        } finally {
          // Don't clear the loading state here - let it persist until redirect completes
          // setIsSubmittingFinalSurvey(false) - removed
        }
      }
    } catch (error: any) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      notifications.error('Failed to save answer', error.message)
      // Reset final survey state if there was an error
      if (isLastQuestion) {
        setIsSubmittingFinalSurvey(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const canProceed = !!currentQuestion && (answers[currentQuestion.id] || []).length > 0
  const isLastQuestion = currentQuestionIndex === questionsArray.length - 1


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
  if ((startSurvey.isPending || isStarting) && !responseId) {
    return <SurveyLoadingState message="Starting survey..." />
  }

  // Check if we should show overlay instead of replacing content
  const shouldShowOverlay = isSubmittingFinalSurvey || responseState.isSubmittingSurvey || isRedirecting
  const overlayMessage = isRedirecting ? "Redirecting to results..." : "Submitting survey..."

  if (questionsError || !questionsArray.length) {
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

  if (!currentQuestion) {
    return null
  }

  return (
    <section className="w-full py-16 relative">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <SurveyHeader
          survey={survey}
          saveStatus={saveStatus}
          onBack={onBack}
        />

        <SurveyProgressBar
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questionsArray.length}
          progress={progress}
        />

        <QuestionCard
          question={currentQuestion}
          selectedAnswers={answers[currentQuestion.id] || []}
          onAnswerChange={handleAnswerChange}
        />

        <SurveyNavigation
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questionsArray.length}
          canProceed={canProceed}
          isLastQuestion={isLastQuestion}
          isSubmitting={responseState.isSubmittingAnswer || responseState.isSubmittingSurvey}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

      {/* Loading overlay */}
      {shouldShowOverlay && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">{overlayMessage}</p>
          </div>
        </div>
      )}
    </section>
  )
}
