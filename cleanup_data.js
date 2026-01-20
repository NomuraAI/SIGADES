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

async function cleanup() {
    console.log('Cleaning up test data...');
    const desas = ['Senggigi', 'Kediri', 'Batu Layar'];
    const { error } = await supabase.from('projects').delete().in('desa', desas);

    if (error) {
        console.error('Cleanup failed:', error);
    } else {
        console.log('Cleanup successful.');
    }
}

cleanup();
