'use client'

import { useSearchParams } from 'next/navigation'
import { useRoles } from '@/hooks/use-roles'
import { FileUploadForm } from '@/components/upload/file-upload-form'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function UploadPage() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const { roles } = useRoles()
  const router = useRouter()
  
  const selectedRole = roleParam ? roles.find(role => role.id === roleParam) : null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {selectedRole && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard/evaluation/new')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evaluation
          </Button>
          <span>•</span>
          <span>Role: {selectedRole.title}</span>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      )}
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {selectedRole ? `Upload Resumes for ${selectedRole.title}` : 'Upload Resumes'}
        </h1>
        <p className="text-gray-600 mt-1">
          {selectedRole 
            ? `Upload candidate resumes to evaluate against the ${selectedRole.title} role`
            : 'Upload PDF resumes for AI evaluation and analysis'
          }
        </p>
      </div>
      
      <FileUploadForm />
    </div>
  )
}