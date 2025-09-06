import { Gift } from 'lucide-react'
import type { Survey } from '@/lib/types'

interface RewardHeaderProps {
  survey: Survey
}

export function RewardHeader({ survey }: RewardHeaderProps) {
  return (
    <div>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Gift className="w-8 h-8 text-green-600" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900 mb-4">Survey Completed!</h2>
      <p className="text-base text-zinc-600">
        Thank you for completing the <strong>{survey.name}</strong> survey from {survey.company}.
      </p>
    </div>
  )
}