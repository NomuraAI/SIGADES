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
        console.error('Error reading .env:', e.message);
    }
    return null;
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing insert with custom data_version: "TEST_VERSION"...');

    const payload = {
        desa_kelurahan: 'Test Desa',
        kecamatan: 'Test Kecamatan',
        data_version: 'TEST_VERSION',
        keterangan: 'Debugging Insert'
    };

    const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);

        // Check if it saved correctly
        if (data[0].data_version === 'TEST_VERSION') {
            console.log('VERIFICATION PASSED: data_version was saved correctly.');
        } else {
            console.error('VERIFICATION FAILED: data_version mismatch. Got:', data[0].data_version);
        }
    }
}

testInsert();
