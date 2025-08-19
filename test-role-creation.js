// Test script to verify role creation works
// Run this with: node test-role-creation.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jsvhzqoxrxbbjztqrztu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRoleCreation() {
  console.log('🔐 Logging in...');
  
  // First, we need to authenticate (you'll need to replace with your credentials)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'dream4pixel@gmail.com', // Replace with your email
    password: 'YOUR_PASSWORD' // Replace with your password
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError);
    return;
  }

  console.log('✅ Authenticated as:', authData.user.email);

  // Test data for role creation
  const testData = {
    role_data: {
      user_id: authData.user.id,
      title: 'Test Role ' + new Date().toISOString(),
      description: 'This is a test role to verify the creation function works',
      responsibilities: 'Test responsibilities',
      bonus_config: {},
      penalty_config: {},
      is_active: true
    },
    skills: [
      {
        skill_name: 'JavaScript',
        skill_category: 'Programming Languages',
        weight: 8,
        is_required: true
      }
    ],
    questions: [
      {
        question_text: 'Do you have experience with React?',
        question_category: 'Technical Experience',
        weight: 7
      }
    ],
    education_requirements: [
      {
        requirement: 'Bachelor degree in Computer Science',
        is_required: true,
        display_order: 1
      }
    ],
    experience_requirements: [
      {
        requirement: '3+ years of web development',
        minimum_years: 3,
        is_required: true,
        display_order: 1
      }
    ]
  };

  console.log('🚀 Creating role with transaction function...');
  
  const { data, error } = await supabase.rpc('create_role_with_details', testData);

  if (error) {
    console.error('❌ Role creation failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Role created successfully!');
    console.log('Role ID:', data.role_id);
    console.log('Stats:', data.stats);
  }

  // Sign out
  await supabase.auth.signOut();
  console.log('👋 Signed out');
}

testRoleCreation().catch(console.error);