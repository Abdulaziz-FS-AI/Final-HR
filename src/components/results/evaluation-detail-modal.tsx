'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EvaluationResultWithDetails } from '@/types'
import { 
  X, 
  User, 
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Mail,
  Phone,
  Calendar,
  Award,
  MessageSquare
} from 'lucide-react'

interface EvaluationDetailModalProps {
  evaluation: EvaluationResultWithDetails
  onClose: () => void
}

export function EvaluationDetailModal({ evaluation, onClose }: EvaluationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'questions' | 'text'>('overview')

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-orange-100 text-orange-800'
      case 'NONE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAnswerColor = (answer: string) => {
    switch (answer) {
      case 'YES': return 'bg-green-100 text-green-800'
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800'
      case 'NO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const skillsAnalysis = evaluation.expanded_view?.skills_analysis || evaluation.skills_analysis || []
  const questionsAnalysis = evaluation.expanded_view?.questions_analysis || evaluation.questions_analysis || []
  const recommendations = evaluation.expanded_view?.recommendations || evaluation.recommendations || []
  const redFlags = evaluation.expanded_view?.red_flags || evaluation.red_flags || []
  const analysisSummary = evaluation.expanded_view?.analysis_summary || evaluation.analysis_summary || ''

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {evaluation.candidate_name || 'Unknown Candidate'}
              </h2>
              <p className="text-sm text-gray-500">
                {evaluation.session?.role?.title || evaluation.role?.title || 'Unknown Role'} • Evaluated on {evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown Date'}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'skills', label: 'Skills Analysis', icon: Target },
            { id: 'questions', label: 'Questions', icon: MessageSquare },
            { id: 'text', label: 'Resume Text', icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center px-6 py-3 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {evaluation.overall_score}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">AI Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round((evaluation.ai_confidence || 0) * 100)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Skills Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {skillsAnalysis.filter((s: any) => s?.found).length}/{skillsAnalysis.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {evaluation.analysis_summary || 'No analysis summary available.'}
                  </p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Recommendations ({recommendations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Red Flags */}
              {redFlags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-700">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Red Flags ({redFlags.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {redFlags.map((flag: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills Analysis</h3>
              {skillsAnalysis.length === 0 ? (
                <p className="text-gray-500">No skills analysis available.</p>
              ) : (
                <div className="grid gap-4">
                  {skillsAnalysis.map((skill: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{skill?.skill_name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(skill?.level)}`}>
                                {skill?.level}
                              </span>
                            </div>
                            {skill?.evidence && (
                              <p className="text-sm text-gray-600 italic">
                                "{skill?.evidence}"
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            {skill?.found ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Questions Analysis</h3>
              {questionsAnalysis.length === 0 ? (
                <p className="text-gray-500">No questions analysis available.</p>
              ) : (
                <div className="grid gap-4">
                  {questionsAnalysis.map((question: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium flex-1">{question?.question}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAnswerColor(question?.answer)}`}>
                              {question?.answer}
                            </span>
                          </div>
                          {question?.evidence && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="text-sm text-gray-700">
                                <strong>Evidence:</strong> "{question?.evidence}"
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resume Text</h3>
              <Card>
                <CardContent className="p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                    {evaluation.file?.extracted_text || 'No extracted text available.'}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t bg-gray-50">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}