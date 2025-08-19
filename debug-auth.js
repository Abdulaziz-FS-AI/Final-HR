const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jsvhzqoxrxbbjztqrztu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzdmh6cW94cnhiYmp6dHFyenR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzAzOTcsImV4cCI6MjA3MTAwNjM5N30.8iAYnlBU9AuT-JbMtlL8NX7gUdZ-gT4l7xmvpmtWw3I'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issue...\n')
  
  try {
    // Check if users table exists and has data
    console.log('1. Checking users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message)
      console.log('💡 Possible issue: RLS policy blocking access or table doesn\'t exist')
    } else {
      console.log(`✅ Users table accessible, found ${users?.length || 0} users`)
      if (users && users.length > 0) {
        console.log('Sample user:', users[0])
      }
    }
    
    // Check auth users (this requires service role)
    console.log('\n2. Checking auth.users (requires service role)...')
    
    // Check roles table structure  
    console.log('\n3. Checking roles table structure...')
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(1)
    
    if (rolesError) {
      console.error('❌ Roles table error:', rolesError.message)
      if (rolesError.message.includes('RLS')) {
        console.log('💡 RLS policy may be blocking unauthenticated access')
      }
    } else {
      console.log('✅ Roles table accessible')
    }
    
    // Check role_skills table
    console.log('\n4. Checking role_skills table...')
    const { data: skills, error: skillsError } = await supabase
      .from('role_skills')
      .select('*')
      .limit(1)
    
    if (skillsError) {
      console.error('❌ Role_skills table error:', skillsError.message)
    } else {
      console.log('✅ Role_skills table accessible')
    }
    
    // Check role_questions table
    console.log('\n5. Checking role_questions table...')
    const { data: questions, error: questionsError } = await supabase
      .from('role_questions')
      .select('*')
      .limit(1)
    
    if (questionsError) {
      console.error('❌ Role_questions table error:', questionsError.message)
    } else {
      console.log('✅ Role_questions table accessible')
    }
    
  } catch (err) {
    console.error('❌ Debug failed:', err)
  }
}

debugAuth()