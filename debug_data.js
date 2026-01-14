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

async function dumpData() {
    console.log('Fetching first 10 rows from projects table...');
    const { data, error } = await supabase
        .from('projects')
        .select('desa, kecamatan')
        .limit(10);

    if (error) {
        console.error('Error fetching data:', error.message);
    } else {
        console.log('Data found:', data);
        if (data.length === 0) {
            console.log('Table appears to be empty.');
        }
    }
}

dumpData();
