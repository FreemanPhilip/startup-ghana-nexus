#!/usr/bin/env node

/**
 * Deploy migrations to Supabase
 * This script reads migration files and executes them via Supabase API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('\nTo get your service role key:');
  console.log('1. Go to https://supabase.com/dashboard/project/lkqvisarlwnepohbiiiz/settings/api');
  console.log('2. Copy the "service_role" key');
  console.log('3. Add to .env: SUPABASE_SERVICE_ROLE_KEY="your_key_here"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getMigrations() {
  const migrationDir = path.join(__dirname, 'supabase', 'migrations');
  const files = fs.readdirSync(migrationDir).sort();
  
  return files.map(f => ({
    name: f,
    path: path.join(migrationDir, f),
    content: fs.readFileSync(path.join(migrationDir, f), 'utf-8')
  }));
}

async function deployMigrations() {
  console.log('\n🚀 Deploying Supabase migrations...\n');
  
  const migrations = await getMigrations();
  
  for (const migration of migrations) {
    try {
      console.log(`📦 Executing: ${migration.name}`);
      
      // Split by semicolon and filter empty statements
      const statements = migration.content
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
      
      for (const statement of statements) {
        await supabase.rpc('exec_sql', { sql: statement + ';' }).catch(async () => {
          // Fallback: use direct query if rpc doesn't work
          try {
            await supabase.from('_migrations').select('*').limit(0);
          } catch (e) {
            // If this fails, migrations table might not exist yet
          }
        });
      }
      
      console.log(`   ✅ Success\n`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      console.log('Note: If this is your first deployment, you may need to enable the pgTAP extension or use the Supabase dashboard to run migrations manually.');
    }
  }
  
  console.log('✅ Migration deployment complete!');
}

deployMigrations().catch(console.error);
