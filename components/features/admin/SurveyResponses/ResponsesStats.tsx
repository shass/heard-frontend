import { Card, CardContent } from '@/components/ui/card'
import type { AdminSurveyResponse, PaginationMeta } from '@/lib/types'

interface ResponsesStatsProps {
  responses: AdminSurveyResponse[]
  pagination: PaginationMeta
}

export function ResponsesStats({ responses, pagination }: ResponsesStatsProps) {
  const completedCount = responses.filter(r => r.completedAt).length
  const inProgressCount = responses.filter(r => !r.completedAt).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{pagination.total}</div>
          <p className="text-sm text-muted-foreground">Total Responses</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{completedCount}</div>
          <p className="text-sm text-muted-foreground">Completed (this page)</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{inProgressCount}</div>
          <p className="text-sm text-muted-foreground">In Progress (this page)</p>
        </CardContent>
      </Card>
    </div>
  )
}
