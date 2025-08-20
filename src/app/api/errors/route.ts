import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const errorReport = await request.json()
    
    // Log error for debugging (in production, send to your monitoring service)
    console.error('🚨 Client Error Report:', {
      message: errorReport.message,
      severity: errorReport.severity,
      url: errorReport.url,
      userId: errorReport.userId,
      sessionId: errorReport.sessionId,
      timestamp: errorReport.timestamp,
      userAgent: errorReport.userAgent
    })

    // In production, you would:
    // 1. Send to Sentry, DataDog, LogRocket, etc.
    // 2. Store in database for analysis
    // 3. Alert on critical errors
    // 4. Aggregate for metrics

    // Example: Store critical errors in Supabase
    if (errorReport.severity === 'critical' || errorReport.severity === 'high') {
      // You could store these in a database table for analysis
      // await supabase.from('error_logs').insert({
      //   message: errorReport.message,
      //   stack: errorReport.stack,
      //   severity: errorReport.severity,
      //   user_id: errorReport.userId,
      //   session_id: errorReport.sessionId,
      //   url: errorReport.url,
      //   user_agent: errorReport.userAgent,
      //   created_at: new Date().toISOString()
      // })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging client error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    )
  }
}