'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EvaluationResultWithDetails } from '@/types'
import { 
  User, 
  Briefcase, 
  Eye, 
  Mail, 
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface EvaluationResultCardProps {
  evaluation: EvaluationResultWithDetails
  onViewDetails: () => void
}

export function EvaluationResultCard({ evaluation, onViewDetails }: EvaluationResultCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Average'
    return 'Below Average'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Candidate Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {evaluation.candidate_name || 'Unknown Candidate'}
                </h3>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {evaluation.role?.title || 'No Role'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(evaluation.created_at || '')}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(evaluation.file?.extracted_text?.includes('@') || evaluation.file?.extracted_text?.includes('phone')) && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                {evaluation.file.extracted_text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {evaluation.file.extracted_text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]}
                  </div>
                )}
                {evaluation.file.extracted_text.match(/[\+]?[\d\s\-\(\)\.\+]{10,}/) && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {evaluation.file.extracted_text.match(/[\+]?[\d\s\-\(\)\.\+]{10,}/)?.[0]}
                  </div>
                )}
              </div>
            )}

            {/* Quick Insights */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Skills Match</p>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${evaluation.overall_score}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{evaluation.overall_score}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">AI Confidence</p>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(evaluation.ai_confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round((evaluation.ai_confidence || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-4">
              {/* Recommendations Count */}
              {Array.isArray(evaluation.recommendations) && evaluation.recommendations.length > 0 && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {evaluation.recommendations.length} recommendations
                </div>
              )}
              
              {/* Red Flags Count */}
              {Array.isArray(evaluation.red_flags) && evaluation.red_flags.length > 0 && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {evaluation.red_flags.length} red flags
                </div>
              )}
            </div>
          </div>

          {/* Score & Actions */}
          <div className="flex flex-col items-end space-y-3">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(evaluation.overall_score)}`}>
                {evaluation.overall_score}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {getScoreLabel(evaluation.overall_score)}
              </p>
            </div>

            {/* Actions */}
            <Button 
              onClick={onViewDetails}
              size="sm"
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}