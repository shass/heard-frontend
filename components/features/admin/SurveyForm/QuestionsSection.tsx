'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { Spinner } from '@/components/ui/loading-states'
import { QuestionEditor } from './QuestionEditor'

interface QuestionsSectionProps {
  questions: any[]
  loadingQuestions: boolean
  register: any
  control: any
  errors: any
  addNewQuestion: () => void
  removeQuestion: (index: number) => void
}

export function QuestionsSection({
  questions,
  loadingQuestions,
  register,
  control,
  errors,
  addNewQuestion,
  removeQuestion,
}: QuestionsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Questions</CardTitle>
          <Button type="button" onClick={addNewQuestion} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingQuestions ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-2 text-sm text-gray-600">Loading questions...</span>
          </div>
        ) : (
          <>
            {questions.map((question, questionIndex) => (
              <QuestionEditor
                key={question.id}
                questionIndex={questionIndex}
                register={register}
                control={control}
                errors={errors}
                onRemove={() => removeQuestion(questionIndex)}
                canRemove={questions.length > 1}
              />
            ))}
            {errors.questions && (
              <p className="text-sm text-red-600">{errors.questions.message}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}