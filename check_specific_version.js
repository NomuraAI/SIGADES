import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getEnv(key) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        for (const line of lines) {
            const parts = line.split('=');
            if (parts[0].trim() === key) {
                return parts[1].trim().replace(/["']/g, '');
            }
        }
    } catch (e) {
        return null;
    }
    return null;
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecific() {
    console.log('Checking for other versions...');

    // Try to find ANY row that is NOT 'APBD LOBAR'
    const { data, error } = await supabase
        .from('projects')
        .select('data_version')
        .neq('data_version', 'APBD LOBAR')
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found non-APBD LOBAR rows:', data);
    }

    // Check specifically for MUSRENBANG
    const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('data_version', 'MUSRENBANG');

    console.log('Count of MUSRENBANG:', count);
}

checkSpecific();
