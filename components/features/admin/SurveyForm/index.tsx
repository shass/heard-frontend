'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSurveyForm } from './hooks/useSurveyForm'
import { BasicInfoSection } from './BasicInfoSection'
import { RewardsSection } from './RewardsSection'
import { QuestionsSection } from './QuestionsSection'
import type {
  CreateSurveyRequest,
  UpdateSurveyRequest,
  AdminSurveyListItem,
} from '@/lib/types'

interface SurveyFormProps {
  survey?: AdminSurveyListItem
  onSubmit: (data: CreateSurveyRequest | UpdateSurveyRequest) => void
  isLoading?: boolean
  onCancel: () => void
}

export function SurveyForm({ survey, onSubmit, isLoading, onCancel }: SurveyFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    errors,
    questions,
    addNewQuestion,
    removeQuestion,
    loadingQuestions,
    handleFormSubmit,
  } = useSurveyForm({ survey, onSubmit })

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <BasicInfoSection
        register={register}
        control={control}
        watch={watch}
        errors={errors}
        isEditMode={!!survey}
      />

      <RewardsSection register={register} errors={errors} />
      
      <QuestionsSection
        questions={questions}
        loadingQuestions={loadingQuestions}
        register={register}
        control={control}
        errors={errors}
        addNewQuestion={addNewQuestion}
        removeQuestion={removeQuestion}
      />

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