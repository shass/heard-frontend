interface SurveyFiltersProps {
  searchQuery: string
  setSearchQuery: (value: string) => void
  selectedCompany: string
  setSelectedCompany: (value: string) => void
  companies: string[]
  isFetching: boolean
}

export function SurveyFilters({
  searchQuery,
  setSearchQuery,
  selectedCompany,
  setSelectedCompany,
  companies,
  isFetching
}: SurveyFiltersProps) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search surveys..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          style={{ minHeight: '42px' }}
        />
        {(searchQuery || selectedCompany) && isFetching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-300 border-t-orange-500"></div>
          </div>
        )}
      </div>
      <div className="sm:w-48">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white bg-no-repeat bg-[right_0.7rem_center] bg-[length:16px] pr-10 truncate"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            minHeight: '42px'
          }}
        >
          <option value="">All Companies</option>
          {companies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
      </div>
    </div>
  )
}