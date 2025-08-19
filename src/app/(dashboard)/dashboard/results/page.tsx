'use client'

import { useSearchParams } from 'next/navigation'
import { EvaluationResultsList } from '@/components/results/evaluation-results-list'
import { EvaluationFilters } from '@/components/results/evaluation-filters'

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const roleId = searchParams.get('role')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Evaluation Results</h1>
        <p className="text-gray-600 mt-1">
          View detailed candidate evaluation results and performance analytics
        </p>
      </div>

      <EvaluationFilters defaultRoleId={roleId} defaultSessionId={sessionId} />
      <EvaluationResultsList roleId={roleId} sessionId={sessionId} />
    </div>
  )
}