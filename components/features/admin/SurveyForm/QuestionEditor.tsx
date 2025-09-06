'use client'

import { Controller, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Plus, Minus } from 'lucide-react'

interface QuestionEditorProps {
  questionIndex: number
  register: any
  control: any
  errors: any
  onRemove: () => void
  canRemove: boolean
}

export function QuestionEditor({
  questionIndex,
  register,
  control,
  errors,
  onRemove,
  canRemove
}: QuestionEditorProps) {
  const { fields: answers, append: addAnswer, remove: removeAnswer } = useFieldArray({
    control,
    name: `questions.${questionIndex}.answers`
  })

  const addNewAnswer = () => {
    const newOrder = answers.length + 1
    addAnswer({ text: '', order: newOrder })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question {questionIndex + 1}</CardTitle>
          {canRemove && (
            <Button type="button" variant="outline" size="sm" onClick={onRemove}>
              <Minus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`question-${questionIndex}-text`}>Question Text *</Label>
          <Textarea
            id={`question-${questionIndex}-text`}
            {...register(`questions.${questionIndex}.questionText`)}
            placeholder="Enter your question"
            rows={2}
          />
          {errors.questions?.[questionIndex]?.questionText && (
            <p className="text-sm text-red-600 mt-1">
              {errors.questions[questionIndex].questionText.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={`question-${questionIndex}-type`}>Question Type *</Label>
          <Controller
            name={`questions.${questionIndex}.questionType`}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Choice</SelectItem>
                  <SelectItem value="multiple">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Answers *</Label>
            <Button type="button" onClick={addNewAnswer} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Answer
            </Button>
          </div>
          <div className="space-y-2">
            {answers.map((answer, answerIndex) => (
              <div key={answer.id} className="flex items-center space-x-2">
                <Input
                  {...register(`questions.${questionIndex}.answers.${answerIndex}.text`)}
                  placeholder={`Answer ${answerIndex + 1}`}
                />
                {answers.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAnswer(answerIndex)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {errors.questions?.[questionIndex]?.answers && (
            <p className="text-sm text-red-600 mt-1">
              {errors.questions[questionIndex].answers.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}