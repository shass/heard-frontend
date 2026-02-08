import {
  SurveyHeader,
  SurveyProgressBar,
  QuestionCard,
  SurveyNavigation,
  type SaveStatus
} from "@/components/survey"
import type { Survey, Question } from "@/lib/types"

interface SurveyContentProps {
  survey: Survey
  saveStatus: SaveStatus
  currentQuestionIndex: number
  questionsArray: Question[]
  progress: number
  currentQuestion: Question
  answers: Record<string, string[]>
  canProceed: boolean
  isLastQuestion: boolean
  isSubmitting: boolean
  onBack: () => void
  onAnswerChange: (questionId: string, answer: string, isMultiple?: boolean) => void
  onPrevious: () => void
  onNext: () => void
}

export function SurveyContent({
  survey,
  saveStatus,
  currentQuestionIndex,
  questionsArray,
  progress,
  currentQuestion,
  answers,
  canProceed,
  isLastQuestion,
  isSubmitting,
  onBack,
  onAnswerChange,
  onPrevious,
  onNext
}: SurveyContentProps) {
  return (
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
        onAnswerChange={onAnswerChange}
      />

      <SurveyNavigation
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questionsArray.length}
        canProceed={canProceed}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  )
}