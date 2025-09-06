import type { RewardLinksData } from '@/lib/types'

interface StatsSectionProps {
  rewardData: RewardLinksData
}

export function StatsSection({ rewardData }: StatsSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{rewardData.stats.total}</div>
        <div className="text-sm text-blue-600">Total Links</div>
      </div>
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{rewardData.stats.unused}</div>
        <div className="text-sm text-green-600">Available</div>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-gray-600">{rewardData.stats.used}</div>
        <div className="text-sm text-gray-600">Used</div>
      </div>
    </div>
  )
}