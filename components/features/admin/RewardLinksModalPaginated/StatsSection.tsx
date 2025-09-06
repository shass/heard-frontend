'use client'

interface StatsSectionProps {
  stats: {
    total: number
    unused: number
    used: number
  } | undefined
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
        <div className="text-sm text-blue-600">Total Links</div>
      </div>
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{stats?.unused || 0}</div>
        <div className="text-sm text-green-600">Available</div>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-gray-600">{stats?.used || 0}</div>
        <div className="text-sm text-gray-600">Used</div>
      </div>
    </div>
  )
}