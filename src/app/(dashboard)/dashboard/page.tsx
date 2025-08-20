'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useRoles } from '@/hooks/use-roles'
import { useEvaluations } from '@/hooks/use-evaluations'
import { useState, useEffect } from 'react'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock,
  Plus,
  Briefcase
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { roles } = useRoles()
  const { evaluations } = useEvaluations()
  const [stats, setStats] = useState({
    totalRoles: 0,
    candidatesEvaluated: 0,
    avgScore: 0,
    processingTime: '0 min'
  })

  useEffect(() => {
    // Calculate real stats from data
    const activeRoles = roles.filter(role => role.is_active).length
    const totalEvaluations = evaluations.length
    
    // Calculate average score
    const totalScore = evaluations.reduce((sum, evaluation) => sum + (evaluation.overall_score || 0), 0)
    const avgScore = totalEvaluations > 0 ? Math.round(totalScore / totalEvaluations) : 0
    
    // Calculate average processing time (mock for now)
    const avgProcessingTime = totalEvaluations > 0 ? '2.3 min' : '0 min'
    
    setStats({
      totalRoles: activeRoles,
      candidatesEvaluated: totalEvaluations,
      avgScore,
      processingTime: avgProcessingTime
    })
  }, [roles, evaluations])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your HR evaluations today.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => router.push('/dashboard/evaluation/new')}>
            <Users className="mr-2 h-4 w-4" />
            New Evaluation
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/roles/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/upload')}>
            <FileText className="mr-2 h-4 w-4" />
            Upload Resumes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              Create your first role to get started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates Evaluated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.candidatesEvaluated}</div>
            <p className="text-xs text-muted-foreground">
              Upload resumes to start evaluating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processingTime}</div>
            <p className="text-xs text-muted-foreground">
              -0.5 min from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Evaluations</CardTitle>
            <CardDescription>
              Latest candidate evaluations across all roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No evaluations yet</p>
                <p className="text-sm mt-1">Upload resumes to start evaluating candidates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluations.slice(0, 5).map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {'Resume'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {evaluation.role?.title || 'Unknown Role'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {evaluation.overall_score}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {evaluations.length > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push('/dashboard/results')}
                  >
                    View All Evaluations
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/roles/create')}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Create New Role
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/evaluation/new')}
            >
              <Users className="mr-2 h-4 w-4" />
              New Evaluation
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/results')}
            >
              <Users className="mr-2 h-4 w-4" />
              View Results
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/dashboard/analytics')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}