'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Minus, GripVertical } from 'lucide-react'
import type { 
  CreateSurveyRequest, 
  UpdateSurveyRequest, 
  AdminSurveyListItem, 
  CreateQuestionRequest,
  CreateAnswerRequest 
} from '@/lib/types'

const answerSchema = z.object({
  text: z.string().min(1, 'Answer text is required'),
  order: z.number()
})

const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.enum(['single', 'multiple'], {
    required_error: 'Question type is required'
  }),
  order: z.number(),
  answers: z.array(answerSchema).min(2, 'At least 2 answers are required'),
  isRequired: z.boolean().default(true)
})

const surveySchema = z.object({
  name: z.string().min(1, 'Survey name is required'),
  company: z.string().min(1, 'Company name is required'),
  description: z.string().min(1, 'Description is required'),
  detailedDescription: z.string().min(1, 'Detailed description is required'),
  criteria: z.string().min(1, 'Criteria is required'),
  rewardAmount: z.number().min(0, 'Reward amount must be positive'),
  rewardToken: z.string().min(1, 'Reward token is required'),
  herdPointsReward: z.number().min(0, 'HerdPoints reward must be positive'),
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
  whitelist: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
})

type SurveyFormData = z.infer<typeof surveySchema>

interface SurveyFormProps {
  survey?: AdminSurveyListItem
  onSubmit: (data: CreateSurveyRequest | UpdateSurveyRequest) => void
  isLoading?: boolean
  onCancel: () => void
}

export function SurveyForm({ survey, onSubmit, isLoading, onCancel }: SurveyFormProps) {
  const [whitelistText, setWhitelistText] = useState('')
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: survey ? {
      name: survey.name,
      company: survey.company,
      description: survey.description,
      detailedDescription: survey.detailedDescription,
      criteria: survey.criteria,
      rewardAmount: survey.rewardAmount,
      rewardToken: survey.rewardToken,
      herdPointsReward: survey.herdPointsReward,
      questions: [],
      whitelist: [],
      isActive: survey.isActive
    } : {
      name: '',
      company: '',
      description: '',
      detailedDescription: '',
      criteria: '',
      rewardAmount: 0,
      rewardToken: 'ETH',
      herdPointsReward: 100,
      questions: [{
        questionText: '',
        questionType: 'single',
        order: 1,
        answers: [
          { text: '', order: 1 },
          { text: '', order: 2 }
        ],
        isRequired: true
      }],
      whitelist: [],
      isActive: true
    }
  })

  const { fields: questions, append: addQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions'
  })

  const handleFormSubmit = (data: SurveyFormData) => {
    const whitelist = whitelistText
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)

    const submitData = {
      ...data,
      whitelist: whitelist.length > 0 ? whitelist : undefined,
      ...(survey ? { id: survey.id } : {})
    }

    onSubmit(submitData as CreateSurveyRequest | UpdateSurveyRequest)
  }

  const addNewQuestion = () => {
    const newOrder = questions.length + 1
    addQuestion({
      questionText: '',
      questionType: 'single',
      order: newOrder,
      answers: [
        { text: '', order: 1 },
        { text: '', order: 2 }
      ],
      isRequired: true
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Survey Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter survey name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                {...register('company')}
                placeholder="Enter company name"
              />
              {errors.company && (
                <p className="text-sm text-red-600 mt-1">{errors.company.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the survey"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="detailedDescription">Detailed Description *</Label>
            <Textarea
              id="detailedDescription"
              {...register('detailedDescription')}
              placeholder="Detailed description including objectives and requirements"
              rows={4}
            />
            {errors.detailedDescription && (
              <p className="text-sm text-red-600 mt-1">{errors.detailedDescription.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="criteria">Eligibility Criteria *</Label>
            <Textarea
              id="criteria"
              {...register('criteria')}
              placeholder="Who can participate in this survey?"
              rows={2}
            />
            {errors.criteria && (
              <p className="text-sm text-red-600 mt-1">{errors.criteria.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Rewards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rewardAmount">Reward Amount *</Label>
              <Input
                id="rewardAmount"
                type="number"
                step="0.001"
                {...register('rewardAmount', { valueAsNumber: true })}
                placeholder="0.01"
              />
              {errors.rewardAmount && (
                <p className="text-sm text-red-600 mt-1">{errors.rewardAmount.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="rewardToken">Reward Token *</Label>
              <Select 
                value={watch('rewardToken')} 
                onValueChange={(value) => setValue('rewardToken', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
              {errors.rewardToken && (
                <p className="text-sm text-red-600 mt-1">{errors.rewardToken.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="herdPointsReward">HerdPoints Reward *</Label>
              <Input
                id="herdPointsReward"
                type="number"
                {...register('herdPointsReward', { valueAsNumber: true })}
                placeholder="100"
              />
              {errors.herdPointsReward && (
                <p className="text-sm text-red-600 mt-1">{errors.herdPointsReward.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
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
        </CardContent>
      </Card>

      {/* Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle>Whitelist (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="whitelist">Wallet Addresses</Label>
            <Textarea
              id="whitelist"
              value={whitelistText}
              onChange={(e) => setWhitelistText(e.target.value)}
              placeholder="Enter wallet addresses, one per line"
              rows={6}
            />
            <p className="text-sm text-gray-600 mt-2">
              Leave empty to allow all users. Enter one wallet address per line.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {survey && (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Survey is active</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : survey ? 'Update Survey' : 'Create Survey'}
        </Button>
      </div>
    </form>
  )
}

interface QuestionEditorProps {
  questionIndex: number
  register: any
  control: any
  errors: any
  onRemove: () => void
  canRemove: boolean
}

function QuestionEditor({ 
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
          <Select 
            value={register(`questions.${questionIndex}.questionType`).value}
            onValueChange={(value) => register(`questions.${questionIndex}.questionType`).onChange({ target: { value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Choice</SelectItem>
              <SelectItem value="multiple">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
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