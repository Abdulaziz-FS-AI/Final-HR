const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jsvhzqoxrxbbjztqrztu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzdmh6cW94cnhiYmp6dHFyenR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzAzOTcsImV4cCI6MjA3MTAwNjM5N30.8iAYnlBU9AuT-JbMtlL8NX7gUdZ-gT4l7xmvpmtWw3I'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('roles')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Connection test failed:', testError)
    } else {
      console.log('✅ Connection successful')
    }
    
    // Test auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth test failed:', authError)
    } else if (session) {
      console.log('✅ User authenticated:', session.user?.id)
    } else {
      console.log('⚠️ No active session - user needs to log in')
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testConnection()