"use client"

import { Button } from "@/components/ui/button"
import { InlineLoading } from "@/components/ui/loading-states"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface SurveyNavigationProps {
  currentQuestionIndex: number
  totalQuestions: number
  canProceed: boolean
  isLastQuestion: boolean
  isSubmitting: boolean
  onPrevious: () => void
  onNext: () => void
}

export function SurveyNavigation({
  currentQuestionIndex,
  totalQuestions,
  canProceed,
  isLastQuestion,
  isSubmitting,
  onPrevious,
  onNext
}: SurveyNavigationProps) {
  return (
    <div className="flex justify-between pt-8">
      <Button
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
        variant="outline"
        className="flex items-center space-x-2 border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 bg-transparent"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      <Button
        onClick={onNext}
        disabled={!canProceed || isSubmitting}
        className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white"
      >
        {isSubmitting && <InlineLoading className="mr-1" />}
        <span>{isLastQuestion ? "Submit Survey" : "Next"}</span>
        {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
      </Button>
    </div>
  )
}