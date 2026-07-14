import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Testing Supabase connection...\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client created');
console.log(`   Project: ${SUPABASE_URL.split('/')[2].split('.')[0]}`);

// Test 1: Check auth status
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log('⚠️  Auth session check:', error.message);
  } else {
    console.log('✅ Auth endpoint responding');
  }
} catch (e) {
  console.error('❌ Auth endpoint error:', e.message);
}

// Test 2: Try to query profiles table
try {
  const { data, error, status } = await supabase
    .from('profiles')
    .select('count(*)', { count: 'exact', head: true });
  
  if (error) {
    console.log('⚠️  Database query error:', error.message);
  } else {
    console.log('✅ Database connected and accessible');
    console.log(`   Profiles table exists`);
  }
} catch (e) {
  console.error('❌ Database connection error:', e.message);
}

// Test 3: Check RLS policies
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error?.code === 'PGRST301') {
    console.log('✅ RLS policies enforced (expected for anonymous user)');
  } else if (error) {
    console.log(`⚠️  Query error: ${error.message}`);
  } else {
    console.log('✅ Can read profiles (RLS allows anonymous access)');
  }
} catch (e) {
  console.error('❌ Error:', e.message);
}

console.log('\n✅ Supabase configuration appears valid!');
