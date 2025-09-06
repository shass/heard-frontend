import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'

interface TopSurvey {
  id: string
  name: string
  responseCount: number
  rewardAmount: number
  rewardToken: string
}

interface DashboardStats {
  topSurveys?: TopSurvey[]
}

interface TopSurveysCardProps {
  stats?: DashboardStats
}

export function TopSurveysCard({ stats }: TopSurveysCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Surveys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats?.topSurveys?.map((survey) => (
            <div key={survey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{survey.name}</h4>
                <p className="text-sm text-gray-600">{survey.responseCount} responses</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">
                  {formatNumber(survey.rewardAmount)} {survey.rewardToken}
                </Badge>
              </div>
            </div>
          )) || (
            <p className="text-center text-gray-500 py-8">No surveys data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}