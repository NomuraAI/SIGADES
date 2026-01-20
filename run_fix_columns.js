import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
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

async function runFix() {
    console.log("Checking database connection...");

    // Test connection
    const { data, error: connError } = await supabase.from('projects').select('count').limit(1);

    if (connError) {
        console.error("Connection failed:", connError.message);
        return;
    }

    console.log("Connection successful. Attempting to run migration via RPC...");

    const sqlPath = path.join(process.cwd(), 'fix_missing_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('RPC exec_sql failed (Predicted).');
        console.log('You MUST run the following SQL manually in your Supabase Dashboard SQL Editor:');
        console.log('---------------------------------------------------');
        console.log(sql);
        console.log('---------------------------------------------------');
    } else {
        console.log('Migration successful! Columns added.');
    }
}

runFix();
