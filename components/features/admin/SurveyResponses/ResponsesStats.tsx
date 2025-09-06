import { Card, CardContent } from '@/components/ui/card'
import type { AdminSurveyResponse } from '@/lib/types'

interface ResponsesStatsProps {
  responses: AdminSurveyResponse[]
}

export function ResponsesStats({ responses }: ResponsesStatsProps) {
  const completedCount = responses.filter(r => r.completedAt).length
  const inProgressCount = responses.filter(r => !r.completedAt).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{responses.length}</div>
          <p className="text-sm text-muted-foreground">Total Responses</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{completedCount}</div>
          <p className="text-sm text-muted-foreground">Completed</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{inProgressCount}</div>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </CardContent>
      </Card>
    </div>
  )
}