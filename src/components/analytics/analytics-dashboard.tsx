'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEvaluations } from '@/hooks/use-evaluations'
import { useRoles } from '@/hooks/use-roles'
import { RoleAnalytics } from '@/types'
import { ErrorBoundary } from '@/components/error-boundary'
import { 
  Users, 
  TrendingUp, 
  Award, 
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

export function AnalyticsDashboard() {
  const { evaluations, loading } = useEvaluations()
  const { roles } = useRoles()
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [timeframe, setTimeframe] = useState<string>('all')
  const [analytics, setAnalytics] = useState<RoleAnalytics | null>(null)

  useEffect(() => {
    if (evaluations.length === 0) return

    // Filter evaluations based on selected role and timeframe
    let filteredEvaluations = evaluations

    if (selectedRole !== 'all') {
      filteredEvaluations = evaluations.filter(evaluation => evaluation.role?.id === selectedRole)
    }

    if (timeframe !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (timeframe) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case '90d':
          cutoffDate.setDate(now.getDate() - 90)
          break
      }
      
      filteredEvaluations = filteredEvaluations.filter(
        evaluation => new Date() >= cutoffDate
      )
    }

    // Calculate analytics
    const calculatedAnalytics = calculateAnalytics(filteredEvaluations)
    setAnalytics(calculatedAnalytics)
  }, [evaluations, selectedRole, timeframe])

  const calculateAnalytics = (evaluationsList: any[]): RoleAnalytics => {
    if (evaluationsList.length === 0) {
      return {
        roleId: selectedRole,
        roleTitle: selectedRole === 'all' ? 'All Roles' : roles.find(r => r.id === selectedRole)?.title || 'Unknown',
        totalEvaluated: 0,
        averageScore: 0,
        qualificationRate: 0,
        skillsAnalysis: {},
        questionsAnalysis: {},
        topCandidates: []
      }
    }

    const totalEvaluated = evaluationsList.length
    const averageScore = evaluationsList.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / totalEvaluated
    const qualifiedCount = evaluationsList.filter(evaluation => evaluation.overall_score >= 70).length
    const qualificationRate = (qualifiedCount / totalEvaluated) * 100

    // Skills analysis
    const skillsAnalysis: any = {}
    evaluationsList.forEach(evaluation => {
      if (Array.isArray(evaluation.skills_analysis)) {
        evaluation.skills_analysis.forEach((skill: any) => {
          if (!skillsAnalysis[skill.skill_name]) {
            skillsAnalysis[skill.skill_name] = {
              availability: 0,
              averageProficiency: 0,
              isBottleneck: false,
              totalCount: 0,
              foundCount: 0,
              proficiencySum: 0
            }
          }
          
          skillsAnalysis[skill.skill_name].totalCount++
          if (skill.found) {
            skillsAnalysis[skill.skill_name].foundCount++
            const proficiencyScore = skill.level === 'HIGH' ? 3 : skill.level === 'MEDIUM' ? 2 : skill.level === 'LOW' ? 1 : 0
            skillsAnalysis[skill.skill_name].proficiencySum += proficiencyScore
          }
        })
      }
    })

    // Calculate final skills metrics
    Object.keys(skillsAnalysis).forEach(skillName => {
      const skill = skillsAnalysis[skillName]
      skill.availability = (skill.foundCount / skill.totalCount) * 100
      skill.averageProficiency = skill.foundCount > 0 ? skill.proficiencySum / skill.foundCount : 0
      skill.isBottleneck = skill.availability < 30 // Less than 30% availability
    })

    // Questions analysis
    const questionsAnalysis: any = {}
    evaluationsList.forEach(evaluation => {
      if (Array.isArray(evaluation.questions_analysis)) {
        evaluation.questions_analysis.forEach((question: any) => {
          if (!questionsAnalysis[question.question]) {
            questionsAnalysis[question.question] = {
              positiveRate: 0,
              averageQuality: 0,
              totalCount: 0,
              positiveCount: 0,
              qualitySum: 0
            }
          }
          
          questionsAnalysis[question.question].totalCount++
          if (question.answer === 'YES') {
            questionsAnalysis[question.question].positiveCount++
          }
          
          const qualityScore = question.quality === 'HIGH' ? 3 : question.quality === 'MEDIUM' ? 2 : question.quality === 'LOW' ? 1 : 0
          questionsAnalysis[question.question].qualitySum += qualityScore
        })
      }
    })

    // Calculate final questions metrics
    Object.keys(questionsAnalysis).forEach(questionText => {
      const question = questionsAnalysis[questionText]
      question.positiveRate = (question.positiveCount / question.totalCount) * 100
      question.averageQuality = question.qualitySum / question.totalCount
    })

    // Top candidates
    const topCandidates = evaluationsList
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, 5)

    return {
      roleId: selectedRole,
      roleTitle: selectedRole === 'all' ? 'All Roles' : roles.find(r => r.id === selectedRole)?.title || 'Unknown',
      totalEvaluated,
      averageScore,
      qualificationRate,
      skillsAnalysis,
      questionsAnalysis,
      topCandidates
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-4">
            Analytics will appear here after you've completed some candidate evaluations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Job Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evaluated</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalEvaluated}</div>
                <p className="text-xs text-muted-foreground">
                  Candidates processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Mean evaluation score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualification Rate</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.qualificationRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Score ≥ 70%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skills Shortage</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(analytics.skillsAnalysis).filter((s: any) => s.isBottleneck).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bottleneck skills
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Skills Analysis */}
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Skills Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.skillsAnalysis).map(([skillName, skill]: [string, any]) => (
                    <div key={skillName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{skillName}</h4>
                          {skill.isBottleneck && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Availability</p>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${skill.availability >= 70 ? 'bg-green-500' : skill.availability >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${skill.availability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{skill.availability.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Avg Proficiency</p>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${(skill.averageProficiency / 3) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{skill.averageProficiency.toFixed(1)}/3</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ErrorBoundary>

          {/* Top Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topCandidates.map((candidate, index) => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{candidate.candidate_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{(candidate as any).role?.title || 'Unknown Role'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{candidate.overall_score}%</p>
                      <p className="text-xs text-gray-500">
                        {new Date(candidate.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}