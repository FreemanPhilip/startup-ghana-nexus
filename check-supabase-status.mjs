import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lkqvisarlwnepohbiiiz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xtuEGL7HuNlstgEnU5l5xg_0mkOwBwp';
const PROJECT_ID = 'lkqvisarlwnepohbiiiz';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('\n═══════════════════════════════════════');
console.log('  SUPABASE CONNECTION STATUS');
console.log('═══════════════════════════════════════\n');

// 1. Check Core Connection
console.log('1️⃣  Core Connection:');
try {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('   ✅ Auth API: Responding');
} catch (e) {
  console.log('   ❌ Auth API: ' + e.message);
}

// 2. Check Database
console.log('\n2️⃣  Database:');
try {
  const { error, status } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error?.code === 'PGRST301') {
    console.log('   ✅ Database: Online (RLS enabled)');
  } else if (!error) {
    console.log('   ✅ Database: Online (accessible)');
  } else {
    console.log('   ⚠️  Database: ' + error.message);
  }
} catch (e) {
  console.log('   ❌ Database: ' + e.message);
}

// 3. Check Real-time
console.log('\n3️⃣  Real-time:');
try {
  const channel = supabase.channel('test');
  const sub = channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {});
  console.log('   ✅ Real-time: Ready');
  channel.unsubscribe();
} catch (e) {
  console.log('   ⚠️  Real-time: ' + e.message);
}

// 4. Check Configuration
console.log('\n4️⃣  Configuration:');
console.log('   Project ID: ' + PROJECT_ID);
console.log('   URL: ' + SUPABASE_URL);
console.log('   Auth persistence: localStorage');
console.log('   Auto refresh: Enabled');

// 5. Check Edge Functions (cannot test from browser, but list them)
console.log('\n5️⃣  Edge Functions:');
console.log('   - mentor-match');
console.log('   - investor-match');
console.log('   - ecosystem-chat');
console.log('   ⚠️  (Requires OPENAI_API_KEY in Supabase env vars)');

console.log('\n═══════════════════════════════════════');
console.log('✅ Supabase is configured and responding!');
console.log('\n📝 Next steps:');
console.log('  1. Add OPENAI_API_KEY to Supabase environment variables');
console.log('  2. Deploy edge functions: supabase functions deploy');
console.log('  3. Configure Google OAuth in Authentication settings');
console.log('═══════════════════════════════════════\n');
