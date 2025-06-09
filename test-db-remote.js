const { createClient } = require('@supabase/supabase-js')

// Use the remote database credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiofzslkzljmxzxhijrz.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpb2Z6c2xremxqbXh6eGhpanJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzQ5NzIsImV4cCI6MjA2MzI1MDk3Mn0.-tpINNw4lPsG8CN6EAtQCy_76WAs5-kzX5BDvHU4V2U'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔗 Testing connection to remote Supabase database...')
  
  try {
    // Test basic connection
    console.log('\n📊 Testing basic database connection...')
    const { data: tables, error } = await supabase.rpc('get_tables')
    
    if (error) {
      console.log('❌ RPC test failed, trying direct table query...')
      
      // Try to list tables directly
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('count', { count: 'exact' })
      
      if (usersError) {
        console.log('❌ Cannot connect to users table:', usersError.message)
      } else {
        console.log('✅ Connected! Users table count:', users)
      }
    }

    // Test each implemented table
    console.log('\n📋 Testing table structure...')
    
    const tablesToTest = ['users', 'profiles', 'tps', 'teams', 'team_members', 'tasks', 'task_updates', 'user_tasks']
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`)
        } else {
          console.log(`✅ Table '${table}': accessible (${data ? data.length : 0} sample records)`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`)
      }
    }

    // Test auth functionality
    console.log('\n🔐 Testing authentication...')
    const { data: session } = await supabase.auth.getSession()
    console.log('Session status:', session.session ? '✅ Active session' : '❌ No session')
    
    // Test creating a sample user (will fail if already exists)
    console.log('\n👤 Testing user creation...')
    const testEmail = 'test.admin@example.com'
    const testPassword = 'test123456'
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Test user already exists, trying to sign in...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        })
        if (signInError) {
          console.log('❌ Sign in failed:', signInError.message)
        } else {
          console.log('✅ Successfully signed in existing test user')
        }
      } else {
        console.log('❌ Auth error:', authError.message)
      }
    } else {
      console.log('✅ Test user created successfully')
    }

    console.log('\n✨ Database test completed!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  }
}

testDatabase()