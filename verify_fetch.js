import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkFetchLoop() {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    console.log('Starting fetch loop...');
    while (hasMore) {
        const { data: chunk, error } = await supabase
            .from('projects')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error:', error);
            break;
        }

        if (chunk && chunk.length > 0) {
            allData = [...allData, ...chunk];
            console.log(`Fetched page ${page + 1}, chunk size: ${chunk.length}, total so far: ${allData.length}`);
            if (chunk.length < pageSize) hasMore = false;
            page++;
        } else {
            hasMore = false;
        }
    }

    console.log('Final Total rows fetched:', allData.length);
    // Check Batulayar Barat
    const batuLayarBarat = allData.filter(d => d.desa && d.desa.toLowerCase() === 'batulayar barat');
    console.log('Found Batulayar Barat entries:', batuLayarBarat.length);
    const sum = batuLayarBarat.reduce((acc, curr) => acc + (curr.pagu_anggaran || 0), 0);
    console.log('Total Pagu Anggaran Batulayar Barat:', sum);
}

checkFetchLoop();
