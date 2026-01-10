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

async function checkSchema() {
    // Fetch 1 row to see the column names
    const { data, error } = await supabase.from('projects').select('*').limit(1);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Row keys:', Object.keys(data[0]));
        console.log('Sample row:', data[0]);
    } else {
        console.log('Table exists but is empty. Cannot verify column names automatically.');
        // If empty, I'll assume standard naming but maybe should try to insert the mock data?
    }
}

checkSchema();
