"use client"

import { Button } from "@/components/ui/button"
import type { Survey } from "@/app/page"

interface SurveyTableProps {
  surveys: Survey[]
  onTakeSurvey: (survey: Survey) => void
}

export function SurveyTable({ surveys, onTakeSurvey }: SurveyTableProps) {
  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Reward</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {surveys.map((survey, index) => (
                  <tr key={survey.id} className={`hover:bg-zinc-50 ${index % 2 === 0 ? "bg-white" : "bg-zinc-25"}`}>
                    <td className="px-6 py-4 text-base text-zinc-900">{survey.name}</td>
                    <td className="px-6 py-4 text-base text-zinc-600">{survey.company}</td>
                    <td className="px-6 py-4 text-base font-medium text-zinc-900">{survey.reward}</td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => onTakeSurvey(survey)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-4 py-2 text-sm font-medium"
                      >
                        Take
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">{survey.name}</h3>
                  <p className="text-sm text-zinc-600">{survey.company}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-zinc-900">{survey.reward}</span>
                  <Button
                    onClick={() => onTakeSurvey(survey)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    Take
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
