
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkConsistency() {
    const { data, error } = await supabase
        .from('projects')
        .select('desa_kelurahan, kecamatan, kepadatan_penduduk')
        .ilike('desa_kelurahan', 'BABUSSALAM');

    if (error) {
        console.error(error);
    } else {
        console.log(`Checking BABUSSALAM rows:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkConsistency();
