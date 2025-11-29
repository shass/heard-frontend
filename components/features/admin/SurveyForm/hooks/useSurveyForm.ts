'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getSurveyQuestions } from '@/lib/api/admin'
import {
  SurveyType,
  type CreateSurveyRequest,
  type UpdateSurveyRequest,
  type AdminSurveyListItem,
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
  heardPointsReward: z.number().min(0, 'HeardPoints reward must be positive'),
  surveyType: z.enum([SurveyType.STANDARD, SurveyType.TIME_LIMITED]).default(SurveyType.STANDARD),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  resultsPageUrl: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
  isActive: z.boolean().optional()
}).refine((data) => {
  // For time_limited surveys, dates are required
  if (data.surveyType === SurveyType.TIME_LIMITED) {
    if (!data.startDate) return false
    if (!data.endDate) return false

    // endDate must be after startDate
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end > start
  }
  return true
}, {
  message: 'For time-limited surveys: start and end dates are required, and end date must be after start date',
  path: ['endDate']
})

export type SurveyFormData = z.infer<typeof surveySchema>

interface UseSurveyFormProps {
  survey?: AdminSurveyListItem
  onSubmit: (data: CreateSurveyRequest | UpdateSurveyRequest) => void
}

export function useSurveyForm({ survey, onSubmit }: UseSurveyFormProps) {
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: survey ? {
      name: survey.name,
      company: survey.company,
      description: survey.description,
      detailedDescription: survey.detailedDescription,
      criteria: survey.criteria,
      rewardAmount: survey.rewardAmount,
      rewardToken: survey.rewardToken,
      heardPointsReward: survey.heardPointsReward,
      surveyType: survey.surveyType || SurveyType.STANDARD,
      // Convert ISO dates to datetime-local format (YYYY-MM-DDTHH:MM)
      startDate: survey.startDate ? new Date(survey.startDate).toISOString().slice(0, 16) : '',
      endDate: survey.endDate ? new Date(survey.endDate).toISOString().slice(0, 16) : '',
      resultsPageUrl: survey.resultsPageUrl || '',
      questions: [],
      isActive: survey.isActive
    } : {
      name: '',
      company: '',
      description: '',
      detailedDescription: '',
      criteria: '',
      rewardAmount: 0,
      rewardToken: 'ETH',
      heardPointsReward: 100,
      surveyType: SurveyType.STANDARD,
      startDate: '',
      endDate: '',
      resultsPageUrl: '',
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
      isActive: true
    }
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = form

  const { fields: questions, append: addQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions'
  })

  // Load questions when editing an existing survey
  useEffect(() => {
    if (survey?.id) {
      setLoadingQuestions(true)
      getSurveyQuestions(survey.id)
        .then((response) => {
          const formattedQuestions = response.questions.map(q => ({
            questionText: q.questionText,
            questionType: q.questionType,
            order: q.order,
            isRequired: q.isRequired,
            answers: q.answers.map(a => ({
              text: a.text,
              order: a.order
            }))
          }))

          // Replace the default empty questions array with actual questions
          setValue('questions', formattedQuestions)
        })
        .catch((error) => {
          console.error('Failed to load survey questions:', error)
        })
        .finally(() => {
          setLoadingQuestions(false)
        })
    }
  }, [survey?.id, setValue])

  const handleFormSubmit = (data: SurveyFormData) => {
    // Convert datetime-local values to ISO 8601 strings for API
    const submitData: any = {
      ...data,
      ...(survey ? { id: survey.id } : {})
    }

    // Format dates to ISO 8601 if they exist
    if (data.startDate && data.surveyType === SurveyType.TIME_LIMITED) {
      submitData.startDate = new Date(data.startDate).toISOString()
    } else {
      delete submitData.startDate
    }

    if (data.endDate && data.surveyType === SurveyType.TIME_LIMITED) {
      submitData.endDate = new Date(data.endDate).toISOString()
    } else {
      delete submitData.endDate
    }

    // Handle resultsPageUrl for time_limited surveys
    if (data.surveyType === SurveyType.TIME_LIMITED) {
      // Always include the field, even if it's an empty string (to allow clearing)
      submitData.resultsPageUrl = data.resultsPageUrl ?? ''
    } else {
      // For standard surveys, remove the field
      delete submitData.resultsPageUrl
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

  return {
    // Form methods
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    errors,

    // Question management
    questions,
    addNewQuestion,
    removeQuestion,

    // State
    loadingQuestions,

    // Handlers
    handleFormSubmit,
  }
}
