'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEvaluations } from '@/hooks/use-evaluations'
import { EvaluationResultCard } from './evaluation-result-card'
import { EvaluationDetailModal } from './evaluation-detail-modal'
import { EvaluationResultWithDetails } from '@/types'
import { 
  FileText, 
  AlertCircle, 
  TrendingUp,
  Users,
  Award,
  BarChart3
} from 'lucide-react'

interface EvaluationResultsListProps {
  roleId?: string | null
  sessionId?: string | null
}

export function EvaluationResultsList({ roleId, sessionId }: EvaluationResultsListProps) {
  const { evaluations, loading, error } = useEvaluations(roleId || undefined, sessionId || undefined)
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResultWithDetails | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Results</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!evaluations.length) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluation Results</h3>
          <p className="text-gray-600 mb-4">
            {roleId || sessionId 
              ? 'No evaluations found for the selected criteria. Try adjusting your filters.'
              : 'No evaluations have been completed yet. Upload and process some resumes to see results here.'
            }
          </p>
          <Button onClick={() => window.location.href = '/dashboard/upload'}>
            Upload Resumes
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Calculate summary statistics
  const avgScore = evaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / evaluations.length
  const topScore = Math.max(...evaluations.map(evaluation => evaluation.overall_score))
  const excellentCount = evaluations.filter(evaluation => evaluation.overall_score >= 80).length
  const goodCount = evaluations.filter(evaluation => evaluation.overall_score >= 60 && evaluation.overall_score < 80).length

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations.length}</div>
            <p className="text-xs text-muted-foreground">
              Evaluated candidates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all evaluations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topScore}%</div>
            <p className="text-xs text-muted-foreground">
              Best candidate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{excellentCount}</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 80% ({((excellentCount / evaluations.length) * 100).toFixed(0)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results ({evaluations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <EvaluationResultCard
                key={evaluation.id}
                evaluation={evaluation}
                onViewDetails={() => setSelectedEvaluation(evaluation)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedEvaluation && (
        <EvaluationDetailModal
          evaluation={selectedEvaluation}
          onClose={() => setSelectedEvaluation(null)}
        />
      )}
    </div>
  )
}