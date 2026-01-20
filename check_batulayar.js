
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkBatulayar() {
    console.log("Checking coordinates for 'Batulayar'...");

    // ilike for case-insensitive partial match
    const { data, error } = await supabase
        .from('projects')
        .select('id, desa, latitude, longitude, lat, lng')
        .ilike('desa', '%Batulayar%');

    if (error) {
        console.error('Error fetching:', error);
    } else {
        console.log(`Found ${data.length} records for Batulayar:`);
        data.forEach(d => {
            console.log(`- ${d.desa}: lat=${d.latitude || d.lat}, lng=${d.longitude || d.lng}`);
        });
    }
}

checkBatulayar();
