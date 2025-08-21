import { NextRequest, NextResponse } from 'next/server'

const HYPERBOLIC_API_URL = 'https://api.hyperbolic.xyz/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.HYPERBOLIC_API_KEY
    if (!apiKey) {
      console.error('HYPERBOLIC_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 500 }
      )
    }

    const response = await fetch(HYPERBOLIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR recruiter. Respond only with valid JSON objects as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.15,
        top_p: 0.85,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`Hyperbolic API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from AI service')
    }

    return NextResponse.json({
      success: true,
      content: data.choices[0].message.content
    })

  } catch (error: any) {
    console.error('AI Evaluation API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'AI evaluation failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}