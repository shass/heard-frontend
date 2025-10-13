"use client"

import { useState, useEffect } from "react"
import { useSurveyQuestions, useStartSurvey } from "@/hooks/use-surveys"
import { useSurveyResponseState, useAnswerValidation } from "@/hooks/use-survey-response"
import { useIsAuthenticated } from "@/lib/store"
import { useNotifications } from "@/components/ui/notifications"
import { surveyApi } from "@/lib/api/surveys"
import type { SaveStatus } from "@/components/survey"
import type { Survey } from "@/lib/types"

interface UseSurveyPageProps {
  survey: Survey
  onSubmit: (responseId?: string) => void
}

export function useSurveyPage({ survey, onSubmit }: UseSurveyPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [responseId, setResponseId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSubmittingFinalSurvey, setIsSubmittingFinalSurvey] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [initStatus, setInitStatus] = useState<'idle' | 'checking' | 'starting' | 'ready' | 'completed'>('idle')

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
      console.log('[useSurveyPage] Survey started successfully:', data)
      setResponseId(data?.responseId || '')
      setInitStatus('ready')
      notifications?.success('Survey started', 'Your progress will be saved automatically')
    },
    onError: (error: any) => {
      console.error('[useSurveyPage] Failed to start survey:', error)
      console.error('[useSurveyPage] Error details:', {
        message: error?.message,
        error: error?.error,
        status: error?.status,
        fullError: error
      })
      setInitStatus('idle')
      // Only show error if it's not because survey is already completed
      if (!error?.message?.includes('already completed')) {
        notifications?.error('Failed to start survey', error?.message || error?.error?.message || 'Unknown error')
      }
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
      // Clear survey state when user logs out
      setAnswers({})
      setResponseId(null)
      setSaveStatus('idle')
      setIsSubmittingFinalSurvey(false)
      setIsRedirecting(false)
      setCurrentQuestionIndex(0)
      setInitStatus('idle')
    }
  }, [isAuthenticated])

  // Initialize survey: check progress and start if needed
  useEffect(() => {
    if (!isAuthenticated || initStatus !== 'idle') return

    const initializeSurvey = async () => {
      setInitStatus('checking')

      try {
        // Check if user has any progress on this survey
        const progressData = await surveyApi.getUserSurveyProgress(survey.id)

        if (progressData.hasCompletedResponse) {
          // Survey already completed - redirect to rewards
          setInitStatus('completed')
          notifications?.info('Survey already completed', 'Redirecting to your results...')
          onSubmit()
          return
        }

        if (progressData.hasIncompleteResponse && progressData.progress) {
          // Resume incomplete survey
          setResponseId(progressData.progress.responseId)
          setCurrentQuestionIndex(progressData.progress.currentQuestionOrder - 1)

          // Restore previous answers
          if (progressData.progress.responses) {
            const previousAnswers: Record<string, string[]> = {}
            progressData.progress.responses.forEach(response => {
              previousAnswers[response.questionId] = response.selectedAnswers
            })
            setAnswers(previousAnswers)
          }

          setInitStatus('ready')
          notifications?.success('Resuming survey', 'Continuing from where you left off')
        } else {
          // Start new survey
          setInitStatus('starting')
          startSurvey.mutate({ id: survey.id })
        }
      } catch (error) {
        console.warn('Failed to initialize survey:', error)
        // Try to start new survey as fallback
        setInitStatus('starting')
        startSurvey.mutate({ id: survey.id })
      }
    }

    initializeSurvey()
  }, [isAuthenticated, initStatus, survey.id, notifications, onSubmit, startSurvey])

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

  // Check if we should show overlay instead of replacing content
  const shouldShowOverlay = isSubmittingFinalSurvey || responseState.isSubmittingSurvey || isRedirecting
  const overlayMessage = isRedirecting ? "Redirecting to results..." : "Submitting survey..."

  return {
    // State
    currentQuestionIndex,
    answers,
    responseId,
    saveStatus,
    isStarting: initStatus === 'starting',
    isCheckingProgress: initStatus === 'checking',
    isSubmittingFinalSurvey,
    isRedirecting,
    isAuthenticated,

    // Data
    questionsData,
    questionsLoading,
    questionsError,
    questions,
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
  }
}
