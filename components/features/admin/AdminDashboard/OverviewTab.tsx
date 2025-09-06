import { StatsCards } from './StatsCards'
import { TopSurveysCard } from './TopSurveysCard'

interface DashboardStats {
  totalSurveys?: number
  activeSurveys?: number
  totalResponses?: number
  monthlyResponses?: number
  totalUsers?: number
  topSurveys?: Array<{
    id: string
    name: string
    responseCount: number
    rewardAmount: number
    rewardToken: string
  }>
}

interface OverviewTabProps {
  stats?: DashboardStats
}

export function OverviewTab({ stats }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Top Surveys */}
      <TopSurveysCard stats={stats} />
    </div>
  )
}