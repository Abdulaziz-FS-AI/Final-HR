'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRoles } from '@/hooks/use-roles'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Users, Settings } from 'lucide-react'

export default function RolesPage() {
  const { roles, loading, error } = useRoles()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error loading roles: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Roles</h1>
          <p className="text-gray-600 mt-1">
            Manage your job roles and requirements
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/roles/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No roles yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first job role to start evaluating candidates
            </p>
            <Button onClick={() => router.push('/dashboard/roles/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Role
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="text-lg">{role.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Skills:</span>
                    <span className="font-medium">{role.skills?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{role.questions?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(role.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/upload?role=${role.id}`)}
                  >
                    <Users className="mr-2 h-3 w-3" />
                    Use Role
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/roles/${role.id}/edit`)}
                    title="Edit Role"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}