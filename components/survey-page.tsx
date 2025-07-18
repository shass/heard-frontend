"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { LoadingState, InlineLoading } from "@/components/ui/loading-states"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import { useSurveyQuestions, useStartSurvey } from "@/hooks/use-surveys"
import { useSurveyResponseState, useAnswerValidation } from "@/hooks/use-survey-response"
import { useIsAuthenticated, useUser } from "@/lib/store"
import { useNotifications } from "@/components/ui/notifications"
import type { Survey, Question } from "@/lib/types"

interface SurveyPageProps {
  survey: Survey
  onSubmit: (responseId?: string) => void
  onBack: () => void
}

export function SurveyPage({ survey, onSubmit, onBack }: SurveyPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [responseId, setResponseId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isStarting, setIsStarting] = useState(false) // Add flag to prevent multiple start requests
  const hasStarted = useRef(false) // Ref to track if start has been attempted
  
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()
  const notifications = useNotifications()
  
  // Load survey questions
  const { 
    data: questions = [], 
    isLoading: questionsLoading, 
    error: questionsError 
  } = useSurveyQuestions(survey.id)
  
  // Start survey mutation
  const startSurvey = useStartSurvey()
  
  // Response state management (only after we have a responseId)
  const responseState = useSurveyResponseState(responseId || null)
  
  // Answer validation
  const { validateRequired, validateSingleChoice } = useAnswerValidation()

  const currentQuestion = Array.isArray(questions) ? questions[currentQuestionIndex] : undefined
  const questionsArray = Array.isArray(questions) ? questions : []
  const progress = questionsArray.length > 0 ? ((currentQuestionIndex + 1) / questionsArray.length) * 100 : 0
  
  // Start survey when component mounts
  useEffect(() => {
    if (isAuthenticated && !responseId && !isStarting && !startSurvey.isPending && !hasStarted.current) {
      console.log('Starting survey:', survey.id)
      hasStarted.current = true
      setIsStarting(true)
      
      startSurvey.mutate(
        { id: survey.id },
        {
          onSuccess: (data) => {
            console.log('Survey started successfully:', data)
            setResponseId(data.responseId)
            setIsStarting(false)
            notifications.success('Survey started', 'Your progress will be saved automatically')
          },
          onError: (error: any) => {
            console.error('Failed to start survey:', error)
            hasStarted.current = false // Reset on error to allow retry
            setIsStarting(false)
            notifications.error('Failed to start survey', error.message)
          }
        }
      )
    }
  }, [isAuthenticated, survey.id]) // Removed responseId and isStarting from dependencies to prevent loops
  
  // Load previous answers when response is available
  useEffect(() => {
    if (responseState.response?.responses) {
      const previousAnswers: Record<string, string[]> = {}
      responseState.response.responses.forEach(response => {
        previousAnswers[response.questionId] = response.selectedAnswers
      })
      setAnswers(previousAnswers)
    }
  }, [responseState.response])

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
    
    // Auto-save the answer
    if (responseId) {
      autoSaveAnswer(questionId, isMultiple ? answers[questionId] || [] : [answer])
    }
  }
  
  const autoSaveAnswer = async (questionId: string, selectedAnswers: string[]) => {
    if (!responseId) return
    
    setSaveStatus('saving')
    
    try {
      await responseState.autoSave({
        responseId,
        questionId,
        selectedAnswers
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
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
    try {
      await responseState.submitAnswer({
        responseId,
        questionId: currentQuestion.id,
        selectedAnswers
      })
      
      if (currentQuestionIndex < questionsArray.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // Submit completed survey
        await responseState.submitSurvey({ responseId })
        onSubmit(responseId)
      }
    } catch (error: any) {
      notifications.error('Failed to save answer', error.message)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const canProceed = currentQuestion && (answers[currentQuestion.id] || []).length > 0
  const isLastQuestion = currentQuestionIndex === questionsArray.length - 1
  
  // Loading states
  if (!isAuthenticated) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">Authentication Required</h2>
          <p className="text-zinc-600">Please connect your wallet to take this survey.</p>
          <Button onClick={onBack} className="mt-4">
            Back to surveys
          </Button>
        </div>
      </section>
    )
  }
  
  if (questionsLoading || startSurvey.isPending || isStarting) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <LoadingState loading={true}>
            <div>Loading survey...</div>
          </LoadingState>
        </div>
      </section>
    )
  }
  
  if (questionsError || !questionsArray.length) {
    return (
      <section className="w-full py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Failed to load survey</h2>
          <p className="text-zinc-600 mb-4">
            {questionsError instanceof Error ? questionsError.message : 'Something went wrong'}
          </p>
          <Button onClick={onBack}>
            Back to surveys
          </Button>
        </div>
      </section>
    )
  }
  
  if (!currentQuestion) {
    return null
  }

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 p-0 h-auto font-normal text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to surveys
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{survey.name}</h2>
              <p className="text-base text-zinc-600 mt-1">{survey.company}</p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              {saveStatus === 'saving' && (
                <div className="flex items-center text-zinc-600">
                  <InlineLoading className="mr-1" />
                  Saving...
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center text-green-600">
                  <Save className="w-4 h-4 mr-1" />
                  Saved
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="text-red-600">Save failed</div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-zinc-600 mb-2">
            <span>
              Question {currentQuestionIndex + 1} of {questionsArray.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2">
            <div
              className="bg-zinc-900 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-zinc-900">{currentQuestion.questionText}</h3>

          <div className="space-y-3">
            {currentQuestion.answers.map((answer: any) => {
              const isMultiple = currentQuestion.questionType === 'multiple'
              const selectedAnswers = answers[currentQuestion.id] || []
              const isSelected = selectedAnswers.includes(answer.id)
              
              return (
                <label
                  key={answer.id}
                  className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  <input
                    type={isMultiple ? "checkbox" : "radio"}
                    name={`question-${currentQuestion.id}`}
                    value={answer.id}
                    checked={isSelected}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, answer.id, isMultiple)}
                    className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                  />
                  <span className="text-base text-zinc-700">{answer.text}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center space-x-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || responseState.isSubmittingAnswer || responseState.isSubmittingSurvey}
            className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white"
          >
            {(responseState.isSubmittingAnswer || responseState.isSubmittingSurvey) && (
              <InlineLoading className="mr-1" />
            )}
            <span>{isLastQuestion ? "Submit Survey" : "Next"}</span>
            {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </section>
  )
}