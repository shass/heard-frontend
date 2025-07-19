"use client"

interface SurveyProgressBarProps {
  currentQuestionIndex: number
  totalQuestions: number
  progress: number
}

export function SurveyProgressBar({ 
  currentQuestionIndex, 
  totalQuestions, 
  progress 
}: SurveyProgressBarProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-zinc-600 mb-2">
        <span>
          Question {currentQuestionIndex + 1} of {totalQuestions}
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
  )
}