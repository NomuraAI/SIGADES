
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkPovertyData() {
    console.log("Checking 'jumlah_angka_kemiskinan' column...");

    // 1. Check if column exists by selecting it
    const { data: colCheck, error: colError } = await supabase
        .from('projects')
        .select('jumlah_angka_kemiskinan')
        .limit(1);

    if (colError) {
        console.error("Error accessing 'jumlah_angka_kemiskinan':", colError.message);
    } else {
        console.log("'jumlah_angka_kemiskinan' column access successful.");
    }

    // 2. Check for the specific version 'DB_SDD_LOBAR' or similar
    // First, list available versions to match what user said
    const { data: versions, error: verError } = await supabase
        .from('projects')
        .select('data_version')
        .not('data_version', 'is', null);

    if (versions) {
        const uniqueVersions = [...new Set(versions.map(v => v.data_version))];
        console.log("Available Versions:", uniqueVersions);
    }

    // 3. Count non-null poverty data
    const { count, error: countError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .gt('jumlah_angka_kemiskinan', 0);

    console.log(`Rows with 'jumlah_angka_kemiskinan' > 0: ${count}`);

    // 4. Sample data for 'DB_SDD_LOBAR' (if exists, or just general sample)
    const { data: sample, error: sampleError } = await supabase
        .from('projects')
        .select('id, desa_kelurahan, jumlah_angka_kemiskinan, data_version')
        .not('jumlah_angka_kemiskinan', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

    if (sample) {
        console.log("Sample rows with poverty data:", sample);
    }
}

checkPovertyData();
