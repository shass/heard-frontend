'use client'

import { QuestionRendererProps } from '@/src/core/interfaces/types'
import { Question, Answer } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function BasicQuestionRenderer({
  question,
  onAnswer
}: QuestionRendererProps) {
  const typedQuestion = question as Question
  const isMultiple = typedQuestion.questionType === 'multiple'

  const handleSingleChoice = (answerId: string) => {
    onAnswer({ questionId: typedQuestion.id, selectedAnswers: [answerId] })
  }

  const handleMultipleChoice = (answerId: string, checked: boolean) => {
    // Get current selected answers (passed via onAnswer callback context)
    const currentAnswers = (question as any).selectedAnswers || []

    const updatedAnswers = checked
      ? [...currentAnswers, answerId]
      : currentAnswers.filter((id: string) => id !== answerId)

    onAnswer({ questionId: typedQuestion.id, selectedAnswers: updatedAnswers })
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-zinc-900">
            {typedQuestion.questionText}
          </h3>
          {typedQuestion.isRequired && (
            <span className="text-sm text-red-600 mt-1">* Required</span>
          )}
        </div>

        {isMultiple ? (
          <div className="space-y-3">
            {typedQuestion.answers.map((answer: Answer) => {
              const isSelected = ((question as any).selectedAnswers || []).includes(answer.id)

              return (
                <div
                  key={answer.id}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  <Checkbox
                    id={answer.id}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleMultipleChoice(answer.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={answer.id}
                    className="flex-1 text-base text-zinc-700 cursor-pointer"
                  >
                    {answer.text}
                  </Label>
                </div>
              )
            })}
          </div>
        ) : (
          <RadioGroup
            onValueChange={handleSingleChoice}
            value={((question as any).selectedAnswers || [])[0]}
          >
            <div className="space-y-3">
              {typedQuestion.answers.map((answer: Answer) => (
                <div
                  key={answer.id}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  <RadioGroupItem value={answer.id} id={answer.id} />
                  <Label
                    htmlFor={answer.id}
                    className="flex-1 text-base text-zinc-700 cursor-pointer"
                  >
                    {answer.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
    </Card>
  )
}
