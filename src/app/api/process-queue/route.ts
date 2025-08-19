import { NextRequest, NextResponse } from 'next/server'
import { AIEvaluationService } from '@/lib/ai-evaluation'

export async function POST(request: NextRequest) {
  try {
    const evaluationService = new AIEvaluationService()
    
    // Process the evaluation queue
    await evaluationService.processQueue()

    return NextResponse.json({
      success: true,
      message: 'Queue processing completed successfully'
    })

  } catch (error: any) {
    console.error('Queue processing error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Queue processing failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const evaluationService = new AIEvaluationService()
    
    // Process the evaluation queue
    await evaluationService.processQueue()

    return NextResponse.json({
      success: true,
      message: 'Queue processing completed successfully'
    })

  } catch (error: any) {
    console.error('Queue processing error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Queue processing failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}