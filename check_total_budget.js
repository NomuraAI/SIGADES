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

const supabaseUrl = "https://xzozhzitylsbjjnihfjr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTotalBudget() {
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    console.log('Fetching all data to calculate total...');

    try {
        while (hasMore) {
            const { data: chunk, error } = await supabase
                .from('projects')
                .select('pagu_anggaran')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (chunk && chunk.length > 0) {
                allData = [...allData, ...chunk];
                if (chunk.length < pageSize) hasMore = false;
                page++;
            } else {
                hasMore = false;
            }
        }

        console.log(`Total rows fetched: ${allData.length}`);

        const total = allData.reduce((acc, curr) => {
            const val = Number(curr.pagu_anggaran) || 0;
            return acc + val;
        }, 0);

        console.log('Total Pagu Anggaran (Database):', total);
        console.log('Formatted:', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total));

        // Target from user: 480.304.370.538
        const target = 480304370538;
        const diff = target - total;
        console.log('Difference from User Target:', diff);
        console.log('Match?', diff === 0 ? 'YES' : 'NO');

    } catch (err) {
        console.error('Error:', err);
    }
}

checkTotalBudget();
