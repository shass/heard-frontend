'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { SurveyFormData } from './hooks/useSurveyForm'

interface BasicInfoSectionProps {
  register: UseFormRegister<SurveyFormData>
  errors: FieldErrors<SurveyFormData>
}

export function BasicInfoSection({ register, errors }: BasicInfoSectionProps) {
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
      </CardContent>
    </Card>
  )
}