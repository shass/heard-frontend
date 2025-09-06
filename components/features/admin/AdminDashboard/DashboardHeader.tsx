import Link from 'next/link'

export function DashboardHeader() {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-6 gap-10">
          <div>
            <Link href="/">
              &larr; To Homepage
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage surveys, whitelists, and monitor platform activity
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}