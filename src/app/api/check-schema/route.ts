import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 SCHEMA CHECK: Examining database table structures...')
    
    // Use service role key for direct database access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check roles table structure
    const { data: rolesSchema, error: rolesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'roles')
      .eq('table_schema', 'public')

    if (rolesError) {
      console.error('Failed to get roles schema:', rolesError)
    } else {
      console.log('📋 Roles table columns:', rolesSchema)
    }

    // Check role_skills table structure
    const { data: skillsSchema, error: skillsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'role_skills')
      .eq('table_schema', 'public')

    if (skillsError) {
      console.error('Failed to get skills schema:', skillsError)
    } else {
      console.log('🎯 Role_skills table columns:', skillsSchema)
    }

    // Check role_questions table structure
    const { data: questionsSchema, error: questionsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'role_questions')
      .eq('table_schema', 'public')

    if (questionsError) {
      console.error('Failed to get questions schema:', questionsError)
    } else {
      console.log('❓ Role_questions table columns:', questionsSchema)
    }

    return NextResponse.json({
      success: true,
      schemas: {
        roles: rolesSchema,
        role_skills: skillsSchema,
        role_questions: questionsSchema
      }
    })

  } catch (error: any) {
    console.error('💥 Schema check failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Schema check failed',
      details: error.message
    }, { status: 500 })
  }
}