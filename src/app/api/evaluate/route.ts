import { NextRequest, NextResponse } from 'next/server'
import { AIEvaluationService } from '@/lib/ai-evaluation'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...params } = body

    const evaluationService = new AIEvaluationService()

    switch (type) {
      case 'single':
        // Evaluate single candidate
        const { roleId, fileId, resumeText, contactInfo } = params
        
        if (!roleId || !fileId) {
          return NextResponse.json(
            { error: 'Missing required parameters: roleId, fileId' },
            { status: 400 }
          )
        }

        // If resumeText is not provided, fetch it from the file_uploads table
        let actualResumeText = resumeText
        let actualContactInfo = contactInfo

        if (!actualResumeText) {
          const supabase = createAdminClient()
          const { data: fileData, error: fileError } = await supabase
            .from('file_uploads')
            .select('extracted_text')
            .eq('id', fileId)
            .single()

          if (fileError || !fileData?.extracted_text) {
            return NextResponse.json(
              { error: 'Could not retrieve resume text for evaluation' },
              { status: 400 }
            )
          }

          actualResumeText = fileData.extracted_text
          
          // Don't extract contact info here - let AI handle it
          // AI will extract contact info more accurately during evaluation
          if (!actualContactInfo) {
            actualContactInfo = {
              name: null,
              email: null,
              phone: null
            }
          }
        }

        const result = await evaluationService.evaluateCandidate({
          roleId,
          fileId,
          resumeText: actualResumeText,
          contactInfo: actualContactInfo
        })

        return NextResponse.json({
          success: true,
          data: result
        })

      case 'batch':
        // Evaluate all files in a session
        const { sessionId, roleId: batchRoleId } = params
        
        if (!sessionId || !batchRoleId) {
          return NextResponse.json(
            { error: 'Missing required parameters: sessionId, roleId' },
            { status: 400 }
          )
        }

        const batchResults = await evaluationService.evaluateBatch(sessionId, batchRoleId)

        return NextResponse.json({
          success: true,
          data: batchResults,
          count: batchResults.length
        })


      default:
        return NextResponse.json(
          { error: 'Invalid evaluation type. Use: single or batch' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Evaluation API error:', error)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Evaluation failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      { error: 'GET endpoint not supported' },
      { status: 405 }
    )

  } catch (error: any) {
    console.error('Evaluation API GET error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Request failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}