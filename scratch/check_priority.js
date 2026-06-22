import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkPriorityValues() {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('aksi_prioritas')
            .limit(500);

        if (error) throw error;

        const uniqueValues = [...new Set(data.map(d => d.aksi_prioritas))];
        console.log('Nilai unik di kolom aksi_prioritas:');
        console.log(uniqueValues);
    } catch (err) {
        console.error(err);
    }
}

checkPriorityValues();
