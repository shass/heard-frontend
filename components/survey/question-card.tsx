"use client"

import type { Question } from "@/lib/types"

interface QuestionCardProps {
  question: Question
  selectedAnswers: string[]
  onAnswerChange: (questionId: string, answerId: string, isMultiple: boolean) => void
}

export function QuestionCard({ question, selectedAnswers, onAnswerChange }: QuestionCardProps) {
  const isMultiple = question.questionType === 'multiple'

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-zinc-900">{question.questionText}</h3>

      <div className="space-y-3">
        {question.answers.map((answer: any) => {
          const isSelected = selectedAnswers.includes(answer.id)
          
          return (
            <label
              key={answer.id}
              className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
            >
              <input
                type={isMultiple ? "checkbox" : "radio"}
                name={`question-${question.id}`}
                value={answer.id}
                checked={isSelected}
                onChange={() => onAnswerChange(question.id, answer.id, isMultiple)}
                className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
              />
              <span className="text-base text-zinc-700">{answer.text}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}