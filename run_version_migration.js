import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runMigration() {
    const sqlPath = path.join(process.cwd(), 'add_data_version.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Running migration: add_data_version.sql');

    // Attempt 1: RPC 'exec_sql' (common pattern)
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration Failed via RPC:', error.message);
        console.log('---------------------------------------------------');
        console.log('PLEASE RUN THIS SQL IN YOUR SUPABASE DASHBOARD > SQL EDITOR:');
        console.log('---------------------------------------------------');
        console.log(sql);
        console.log('---------------------------------------------------');
        process.exit(1);
    } else {
        console.log('Migration successful!');
    }
}

runMigration();
