'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useRoles } from '@/hooks/use-roles'
import { useEvaluations } from '@/hooks/use-evaluations'
// Use fixed PDF extraction API directly
import { useErrorToast, useSuccessToast } from '@/components/ui/toast'
import { getUserFriendlyMessage } from '@/lib/error-handling'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from "@/lib/supabase"
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  Briefcase,
  Eye
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  result?: any
}

export function FileUploadForm() {
  const { user } = useAuth()
  const { roles } = useRoles()
  const { triggerBatchEvaluation } = useEvaluations()
  const router = useRouter()
  const showError = useErrorToast()
  const showSuccess = useSuccessToast()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(2)}`)
  const [evaluationInProgress, setEvaluationInProgress] = useState(false)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)

  // Check for pre-selected role from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const roleParam = urlParams.get('role')
    if (roleParam && roles.find(role => role.id === roleParam)) {
      setSelectedRole(roleParam)
    }
  }, [roles])
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      status: 'pending'
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  const processFile = async (uploadFile: UploadFile, actualSessionId?: string) => {
    if (!user) {
      console.error('No user found')
      return
    }

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ))

      // Start processing
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'processing' } : f
      ))

      // Use the fixed PDF extraction API
      const formData = new FormData()
      formData.append('pdf', uploadFile.file)
      
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'PDF extraction failed')
      }
      
      const extractionResult = await response.json()
      
      // Store in database
      const { data: resume, error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          file_name: uploadFile.file.name,
          file_size: uploadFile.file.size,
          extracted_text: extractionResult.text,
          user_id: user.id,
          session_id: actualSessionId || sessionId,
          extraction_metadata: extractionResult.metadata,
          processing_status: 'completed'
        })
        .select()
        .single()
      
      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }
      
      const result = {
        extractionId: resume.id,
        text: extractionResult.text,
        confidence: extractionResult.info?.confidence || 0.8,
        duration: 1000, // placeholder
        issues: extractionResult.info?.extractionFailed ? ['Extraction quality may be low'] : []
      }

      // Update with success
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'completed',
          result
        } : f
      ))

    } catch (error: any) {
      console.error('File processing error:', error)
      
      const errorMessage = getUserFriendlyMessage(error)
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error',
          error: errorMessage
        } : f
      ))
      
      showError(
        'File Processing Failed',
        `Failed to process ${uploadFile.file.name}: ${errorMessage}`
      )
    }
  }

  const processAllFiles = async () => {
    if (!selectedRole) {
      alert('Please select a role first')
      return
    }

    const pendingFiles = files.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) {
      return
    }

    try {
      // Get role details for snapshot
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select(`
          *,
          skills:role_skills(*),
          questions:role_questions(*),
          education_requirements:role_education_requirements(*),
          experience_requirements:role_experience_requirements(*)
        `)
        .eq('id', selectedRole)
        .single()

      if (roleError || !roleData) {
        throw new Error('Failed to fetch role details')
      }

      // Create optimized role snapshot (remove circular references and limit size)
      const roleSnapshot = {
        id: roleData.id,
        title: roleData.title,
        description: roleData.description,
        responsibilities: roleData.responsibilities,
        bonus_config: roleData.bonus_config,
        penalty_config: roleData.penalty_config,
        skills: roleData.skills?.map(s => ({
          skill_name: s.skill_name,
          weight: s.weight,
          is_required: s.is_required,
          skill_category: s.skill_category
        })) || [],
        questions: roleData.questions?.map(q => ({
          question_text: q.question_text,
          weight: q.weight,
          question_category: q.question_category
        })) || [],
        education_requirements: roleData.education_requirements?.map(e => ({
          requirement: e.requirement,
          is_required: e.is_required
        })) || [],
        experience_requirements: roleData.experience_requirements?.map(e => ({
          requirement: e.requirement,
          minimum_years: e.minimum_years,
          is_required: e.is_required
        })) || []
      }

      // Create evaluation session for this upload
      const sessionData = {
        role_id: selectedRole,
        user_id: user!.id,
        total_resumes: pendingFiles.length,
        session_name: `Upload ${new Date().toLocaleDateString()}`,
        status: 'pending',
        role_snapshot: roleSnapshot
      }
      
      const { data: session, error: sessionError } = await supabase
        .from('evaluation_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError) {
        console.error('Failed to create evaluation session:', sessionError)
        showError(
          'Failed to Create Evaluation Session',
          `Error: ${sessionError.message}`
        )
        return
      }

      // Update session ID for all files
      const updatedSessionId = session.id
      
      // Process files one by one to avoid overwhelming the system
      for (const file of pendingFiles) {
        await processFile(file, updatedSessionId)
      }

      // After all files are processed, trigger evaluation
      await triggerEvaluationForSession(updatedSessionId)
      
      showSuccess(
        'Files Processed Successfully',
        `Successfully processed ${pendingFiles.length} files and started AI evaluation.`
      )
    } catch (error: any) {
      console.error('Upload process failed:', error)
      const errorMessage = getUserFriendlyMessage(error)
      showError('Upload Process Failed', errorMessage)
    }
  }

  const triggerEvaluationForSession = async (sessionId: string) => {
    if (!selectedRole) return

    try {
      setEvaluationInProgress(true)
      
      // Wait a moment for all extractions to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Trigger batch evaluation
      await triggerBatchEvaluation(sessionId, selectedRole)
      
      // Save completed session ID for results navigation
      setCompletedSessionId(sessionId)
    } catch (error) {
      console.error('Evaluation failed:', error)
      alert('AI evaluation failed, but files were processed successfully')
    } finally {
      setEvaluationInProgress(false)
    }
  }

  const canProcess = files.some(f => f.status === 'pending') && selectedRole && user

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            Select Job Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a role to evaluate candidates against" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roles.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No roles available. Create a role first to evaluate candidates.
            </p>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Resume Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the PDF files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop PDF files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 10MB per file
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={processAllFiles} 
                disabled={!canProcess || evaluationInProgress}
                className="flex items-center"
              >
                <Upload className="mr-2 h-4 w-4" />
                Process All Files
              </Button>
              
              {completedSessionId && (
                <Button 
                  onClick={() => router.push(`/dashboard/results?session=${completedSessionId}&role=${selectedRole}`)}
                  variant="outline"
                  className="flex items-center"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Results
                </Button>
              )}
              
              {evaluationInProgress && (
                <span className="text-sm text-blue-600 flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  AI Evaluation in progress...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{uploadFile.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'pending' && (
                        <span className="text-gray-500 text-sm">Ready</span>
                      )}
                      {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                        <>
                          <Loader className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-blue-600 text-sm capitalize">
                            {uploadFile.status}
                          </span>
                        </>
                      )}
                      {uploadFile.status === 'completed' && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 text-sm">Completed</span>
                        </>
                      )}
                      {uploadFile.status === 'error' && (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 text-sm">Failed</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={uploadFile.status === 'uploading' || uploadFile.status === 'processing'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Processing Summary */}
            {files.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-600">
                      {files.filter(f => f.status === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {files.filter(f => f.status === 'uploading' || f.status === 'processing').length}
                    </p>
                    <p className="text-sm text-gray-500">Processing</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {files.filter(f => f.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {files.filter(f => f.status === 'error').length}
                    </p>
                    <p className="text-sm text-gray-500">Failed</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {files.some(f => f.status === 'completed') && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files
                .filter(f => f.status === 'completed')
                .map((uploadFile) => (
                  <div key={uploadFile.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{uploadFile.file.name}</h4>
                    {uploadFile.result && (
                      <div className="text-sm space-y-1">
                        <p><strong>Extraction ID:</strong> {uploadFile.result.extractionId}</p>
                        <p><strong>Confidence:</strong> {Math.round(uploadFile.result.confidence * 100)}%</p>
                        <p><strong>Processing Time:</strong> {(uploadFile.result.duration / 1000).toFixed(2)}s</p>
                        {uploadFile.result.issues.length > 0 && (
                          <p><strong>Issues:</strong> {uploadFile.result.issues.join(', ')}</p>
                        )}
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600">View extracted text preview</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                            {uploadFile.result.text?.substring(0, 500)}...
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}