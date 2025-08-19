import { NextRequest, NextResponse } from 'next/server'
import { AIEvaluationService } from '@/lib/ai-evaluation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...params } = body

    const evaluationService = new AIEvaluationService()

    switch (type) {
      case 'single':
        // Evaluate single candidate
        const { roleId, fileId, resumeText, contactInfo } = params
        
        if (!roleId || !fileId || !resumeText) {
          return NextResponse.json(
            { error: 'Missing required parameters: roleId, fileId, resumeText' },
            { status: 400 }
          )
        }

        const result = await evaluationService.evaluateCandidate({
          roleId,
          fileId,
          resumeText,
          contactInfo
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

      case 'queue':
        // Process evaluation queue
        await evaluationService.processQueue()

        return NextResponse.json({
          success: true,
          message: 'Queue processing completed'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid evaluation type. Use: single, batch, or queue' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Evaluation API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Evaluation failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    const evaluationService = new AIEvaluationService()

    switch (action) {
      case 'process-queue':
        // Trigger queue processing
        await evaluationService.processQueue()
        
        return NextResponse.json({
          success: true,
          message: 'Queue processing initiated'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

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