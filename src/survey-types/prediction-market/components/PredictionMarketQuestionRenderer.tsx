'use client'

import { QuestionRendererProps } from '@/src/core/interfaces/types'
import { Question, Answer } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

export function PredictionMarketQuestionRenderer({
  survey,
  question,
  onAnswer
}: QuestionRendererProps) {
  const typedQuestion = question as Question
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!survey.endDate) return ''

      const now = new Date()
      const end = new Date(survey.endDate)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) return 'Market closed'

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) return `${days}d ${hours}h remaining`
      if (hours > 0) return `${hours}h ${minutes}m remaining`
      return `${minutes}m remaining`
    }

    setTimeRemaining(calculateTimeRemaining())

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [survey.endDate])

  const handleAnswer = (answerId: string) => {
    onAnswer({ questionId: typedQuestion.id, selectedAnswers: [answerId] })
  }

  const totalPool = (survey as any).totalPool || survey.heardPointsReward || 0

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header with market info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-medium text-zinc-900">
              {typedQuestion.questionText}
            </h3>
            <Badge variant="secondary" className="ml-2">
              Prediction Market
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {timeRemaining && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-600">⏱️</span>
                <span className="text-zinc-700 font-medium">{timeRemaining}</span>
              </div>
            )}
            {totalPool > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-600">💰</span>
                <span className="text-zinc-700 font-medium">
                  {totalPool} HP Pool
                </span>
              </div>
            )}
          </div>

          {typedQuestion.isRequired && (
            <span className="text-sm text-red-600">* Required</span>
          )}
        </div>

        {/* Answer options */}
        <RadioGroup
          onValueChange={handleAnswer}
          value={((question as any).selectedAnswers || [])[0]}
        >
          <div className="space-y-3">
            {typedQuestion.answers.map((answer: Answer) => {
              const isSelected = ((question as any).selectedAnswers || []).includes(
                answer.id
              )

              return (
                <div
                  key={answer.id}
                  className={`
                    flex items-center space-x-3 p-4 rounded-lg border
                    transition-all duration-200
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-zinc-200 hover:bg-zinc-50'
                    }
                  `}
                >
                  <RadioGroupItem value={answer.id} id={answer.id} />
                  <Label
                    htmlFor={answer.id}
                    className="flex-1 text-base text-zinc-700 cursor-pointer font-medium"
                  >
                    {answer.text}
                  </Label>
                  {/* Future: Show odds/probability here if available */}
                </div>
              )
            })}
          </div>
        </RadioGroup>

        {/* Info footer */}
        <div className="pt-4 border-t border-zinc-200">
          <p className="text-sm text-zinc-600">
            💡 Choose your prediction. Correct predictors will split the reward pool.
          </p>
        </div>
      </div>
    </Card>
  )
}
