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

async function testSearch(label) {
    console.log(`\nTesting search with label: "${label}"`);
    const searchKeyword = label.split(',')[0].trim();
    console.log(`Extracted keyword: "${searchKeyword}"`);

    const { data, error } = await supabase
        .from('projects')
        .select('desa, kecamatan')
        .or(`desa.ilike.%${searchKeyword}%,kecamatan.ilike.%${searchKeyword}%`)
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Found ${data.length} matches.`);
        if (data.length > 0) {
            console.log('Sample results:', data);
        } else {
            console.log('No matches found.');
        }
    }
}

async function runTests() {
    // Test Case 1: Village Name
    await testSearch('Senggigi, Batulayar, Lombok Barat');

    // Test Case 2: District Name (that might also be a village name or contain villages)
    await testSearch('Kediri, Lombok Barat'); // Kediri is both a Kecamatan and often a Desa name in Indonesia
    
    // Test Case 3: Partial
    await testSearch('Batu, Lombok Barat'); 
}

runTests();
