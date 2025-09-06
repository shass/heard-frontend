'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getSurveyQuestions } from '@/lib/api/admin'
import type {
  CreateSurveyRequest,
  UpdateSurveyRequest,
  AdminSurveyListItem,
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
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
  isActive: z.boolean().optional()
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
    const submitData = {
      ...data,
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