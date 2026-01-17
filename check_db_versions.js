import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser since we can't rely on dotenv being installed/configured for this script
function getEnv(key) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const parts = line.split('=');
            if (parts[0].trim() === key) {
                return parts[1].trim().replace(/["']/g, ''); // simple unquote
            }
        }
    } catch (e) {
        console.error('Error reading .env:', e.message);
    }
    return null;
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVersions() {
    console.log('Checking database versions...');

    // 1. Check if column exists by trying to select it
    const { data, error } = await supabase
        .from('projects')
        .select('data_version')
        .limit(10);

    if (error) {
        console.error('ERROR Querying data_version:', error.message);
        console.error('This strongly suggests the "data_version" column DOES NOT EXIST in the database.');
        console.error('Please run the "add_data_version.sql" script in your Supabase SQL Editor.');
        return;
    }

    console.log('Sample rows (data_version):', data);

    // 2. Count distinct versions (simulated since we can't do exact distinct count easily via standard client without RPC or huge fetch)
    // We'll fetch a larger chunk to see distribution
    const { data: allData, error: allError } = await supabase
        .from('projects')
        .select('data_version')
        .limit(1000);

    if (allError) {
        console.error('Error fetching all data:', allError.message);
        return;
    }

    const counts = {};
    allData.forEach(row => {
        const v = row.data_version || 'NULL/Undefined';
        counts[v] = (counts[v] || 0) + 1;
    });

    console.log('Version Distribution (Sample 1000 rows):');
    console.table(counts);
}

checkVersions();
