
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkKepadatan() {
    const { data, error, count } = await supabase
        .from('projects')
        .select('desa_kelurahan, kecamatan, luas_wilayah, jumlah_penduduk, kepadatan_penduduk', { count: 'exact' })
        .gt('kepadatan_penduduk', 0);

    if (error) {
        console.error(error);
    } else {
        console.log(`Found ${count} records with kepadatan > 0`);
        console.log(JSON.stringify(data.slice(0, 10), null, 2));
    }
}

checkKepadatan();
