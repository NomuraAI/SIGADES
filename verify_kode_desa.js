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

async function checkColumn() {
    console.log("Checking project table column...");
    // Try to select kode_desa.
    const { data, error } = await supabase.from('projects').select('kode_desa').limit(1);

    if (error) {
        console.error('Error fetching kode_desa:', error.message);
    } else {
        console.log('Successfully selected kode_desa column!');
        console.log('Sample data:', data);
    }
}

checkColumn();
