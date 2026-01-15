
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        envVars[key] = val;
    }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns for table "projects"...');

    const dummyId = '00000000-0000-0000-0000-000000000000';

    const { data: inserted, error: insertError } = await supabase
        .from('projects')
        .insert([{ id: dummyId, pekerjaan: 'SCHEMA_CHECK' }])
        .select();

    if (insertError) {
        console.error('Error inserting dummy row:', insertError);
        return;
    }

    if (inserted && inserted.length > 0) {
        console.log('Columns found:', Object.keys(inserted[0]));

        // Cleanup
        const { error: deleteError } = await supabase.from('projects').delete().eq('id', dummyId);
        if (deleteError) console.error('Error cleaning up:', deleteError);
    } else {
        console.log('Inserted specific row but got no return data.');
    }
}

checkColumns();
