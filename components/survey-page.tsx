"use client"

import { useState, useEffect, useRef } from "react"
import { useSurveyQuestions, useStartSurvey } from "@/hooks/use-surveys"
import { useSurveyResponseState, useAnswerValidation } from "@/hooks/use-survey-response"
import { useIsAuthenticated } from "@/lib/store"
import { useNotifications } from "@/components/ui/notifications"
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
  const hasStarted = useRef(false)

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
  const responseState = useSurveyResponseState(responseId || null)

  // Answer validation
  const { validateRequired, validateSingleChoice } = useAnswerValidation()

  const currentQuestion = Array.isArray(questions) ? questions[currentQuestionIndex] : undefined
  const questionsArray = Array.isArray(questions) ? questions : []
  const progress = questionsArray.length > 0 ? ((currentQuestionIndex + 1) / questionsArray.length) * 100 : 0

  // Clear survey state when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear survey state when user logs out or wallet changes
      setAnswers({})
      setResponseId(null)
      setSaveStatus('idle')
      setIsStarting(false)
      hasStarted.current = false
      setCurrentQuestionIndex(0)
    }
  }, [isAuthenticated])

  // Start survey when component mounts or authentication is restored
  useEffect(() => {
    if (isAuthenticated && !responseId && !isStarting && !startSurvey.isPending && !hasStarted.current) {
      hasStarted.current = true
      setIsStarting(true)
      startSurvey.mutate({ id: survey.id })
    }
  }, [isAuthenticated, survey.id])

  // TODO: Load previous answers when response endpoint is implemented
  // useEffect(() => {
  //   if (responseState.response?.responses) {
  //     const previousAnswers: Record<string, string[]> = {}
  //     responseState.response.responses.forEach(response => {
  //       previousAnswers[response.questionId] = response.selectedAnswers
  //     })
  //     setAnswers(previousAnswers)
  //   }
  // }, [responseState.response])

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

    // Validate current answer
    const selectedAnswers = answers[currentQuestion.id] || []
    const requiredValidation = validateRequired(currentQuestion, selectedAnswers)
    const singleChoiceValidation = validateSingleChoice(currentQuestion, selectedAnswers)

    if (!requiredValidation.isValid) {
      notifications.error('Answer required', requiredValidation.error!)
      return
    }

    if (!singleChoiceValidation.isValid) {
      notifications.error('Invalid selection', singleChoiceValidation.error!)
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
        // Submit completed survey
        console.log('Submitting completed survey with responseId:', responseId)
        await responseState.submitSurvey({ responseId })
        console.log('Survey submitted successfully')
        onSubmit(responseId)
      }
    } catch (error: any) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      notifications.error('Failed to save answer', error.message)
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

  // Show starting state while survey is being started
  if ((startSurvey.isPending || isStarting) && !responseId) {
    return <SurveyLoadingState message="Starting survey..." />
  }

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
    <section className="w-full py-16">
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
    </section>
  )
}
