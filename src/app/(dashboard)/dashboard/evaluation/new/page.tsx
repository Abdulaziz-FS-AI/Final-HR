'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRoles } from '@/hooks/use-roles'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Briefcase, 
  ArrowRight, 
  Plus,
  CheckCircle,
  FileText,
  Target
} from 'lucide-react'

export default function NewEvaluationPage() {
  const router = useRouter()
  const { roles, loading } = useRoles()
  const [selectedRole, setSelectedRole] = useState<string>('')

  const handleStartEvaluation = () => {
    if (selectedRole) {
      router.push(`/dashboard/upload?role=${selectedRole}`)
    }
  }

  const handleCreateRole = () => {
    router.push('/dashboard/roles/create')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Evaluation</h1>
        <p className="text-gray-600 mt-1">
          Start evaluating candidates by selecting a role and uploading resumes
        </p>
      </div>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Evaluation Workflow
          </CardTitle>
          <CardDescription>
            Follow these steps to evaluate candidates effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Select Role</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose the job role you want to evaluate candidates for
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Upload Resumes</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload candidate resumes (PDF format, bulk or single)
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Review Results</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get AI-powered evaluation results and candidate rankings
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            Step 1: Select Role
          </CardTitle>
          <CardDescription>
            Choose which role you want to evaluate candidates for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {roles.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No roles available</h3>
              <p className="text-gray-600 mb-4">
                You need to create a job role before you can start evaluating candidates.
              </p>
              <Button onClick={handleCreateRole}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Role
              </Button>
            </div>
          ) : (
            <>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role for evaluation" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{role.title}</span>
                        <div className="flex space-x-1 ml-2">
                          <Badge variant="secondary" className="text-xs">
                            {role.skills?.length || 0} skills
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {role.questions?.length || 0} questions
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRole && (
                <div className="mt-4">
                  {(() => {
                    const role = roles.find(r => r.id === selectedRole)
                    return role ? (
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-green-900">{role.title}</h4>
                              <p className="text-sm text-green-700 mt-1 line-clamp-2">
                                {role.description}
                              </p>
                              <div className="flex space-x-4 mt-2 text-sm text-green-600">
                                <span>{role.skills?.length || 0} skills defined</span>
                                <span>{role.questions?.length || 0} evaluation questions</span>
                              </div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ) : null
                  })()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Next Step */}
      {selectedRole && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Ready to Start Evaluation</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Proceed to upload candidate resumes for the selected role
                </p>
              </div>
              <Button onClick={handleStartEvaluation}>
                Upload Resumes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => router.push('/dashboard/roles')}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            View All Roles
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => router.push('/dashboard/roles/create')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Role
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => router.push('/dashboard/results')}
          >
            <FileText className="mr-2 h-4 w-4" />
            View Past Evaluations
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}