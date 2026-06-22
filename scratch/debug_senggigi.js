import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function debugSenggigi() {
    try {
        console.log('--- Debugging Data Desa SENGGIGI ---');
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .ilike('desa_kelurahan', 'SENGGIGI');

        if (error) throw error;

        if (data && data.length > 0) {
            console.log(`Ditemukan ${data.length} baris untuk Senggigi.`);
            console.log('Contoh data baris pertama:');
            console.log(JSON.stringify(data[0], null, 2));
            
            const totalBudget = data.reduce((sum, item) => sum + (item.pagu_anggaran || 0), 0);
            console.log('\nTotal Anggaran di DB (Tanpa filter versi):', totalBudget);
            
            const versions = [...new Set(data.map(d => d.data_version))];
            console.log('Versi data yang tersedia:', versions);
        } else {
            console.log('Data Desa SENGGIGI TIDAK DITEMUKAN di database!');
        }
    } catch (err) {
        console.error(err);
    }
}

debugSenggigi();
