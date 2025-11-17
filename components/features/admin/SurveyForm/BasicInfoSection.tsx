'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UseFormRegister, FieldErrors, Control, Controller, UseFormWatch } from 'react-hook-form'
import { SurveyFormData } from './hooks/useSurveyForm'

interface BasicInfoSectionProps {
  register: UseFormRegister<SurveyFormData>
  control: Control<SurveyFormData>
  watch: UseFormWatch<SurveyFormData>
  errors: FieldErrors<SurveyFormData>
  isEditMode?: boolean
}

export function BasicInfoSection({ register, control, watch, errors, isEditMode }: BasicInfoSectionProps) {
  const surveyType = watch('surveyType')

  return (
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

        {/* Survey Type */}
        <div>
          <Label htmlFor="surveyType">Survey Type *</Label>
          <Controller
            name="surveyType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select survey type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Survey</SelectItem>
                  <SelectItem value="time_limited">Time-Limited Survey</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.surveyType && (
            <p className="text-sm text-red-600 mt-1">{errors.surveyType.message}</p>
          )}
        </div>

        {/* Time-Limited Survey Fields */}
        {surveyType === 'time_limited' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  Survey will be available from this date
                </p>
              </div>

              <div>
                <Label htmlFor="endDate">End Date & Time *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  Survey will close at this date
                </p>
              </div>
            </div>

            {isEditMode && (
              <div>
                <Label htmlFor="resultsPageUrl">Results Page URL</Label>
                <Input
                  id="resultsPageUrl"
                  type="url"
                  {...register('resultsPageUrl')}
                  placeholder="https://example.com/results"
                />
                {errors.resultsPageUrl && (
                  <p className="text-sm text-red-600 mt-1">{errors.resultsPageUrl.message}</p>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  Optional. Add URL to publicly accessible results page after survey ends.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}