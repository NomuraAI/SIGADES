
import { createClient } from '@supabase/supabase-js';

// Hardcoded values from client.ts
const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function debugInsertNoSelect() {
    console.log("Attempting to insert a row WITHOUT .select()...");

    const payload = {
        pekerjaan: 'DEBUG INSERT NO SELECT ' + Date.now(),
        // Minimal payload, other fields should be null-able now
    };

    // INTENTIONAL: No .select() chained at the end
    const { data, error } = await supabase.from('projects').insert([payload]);

    if (error) {
        console.error('INSERT FAILED!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Error Details:', error.details);
    } else {
        console.log('INSERT SUCCESS!');
        console.log('Data (should be null):', data);

        // Clean up manually since we don't have the ID from data
        // We'll just search by the unique name we just made
        const { data: searchData } = await supabase.from('projects').select('id').eq('pekerjaan', payload.pekerjaan);
        if (searchData && searchData.length > 0) {
            const { error: delError } = await supabase.from('projects').delete().eq('id', searchData[0].id);
            if (delError) console.error("Could not clean up test row:", delError);
            else console.log("Cleaned up test row.");
        }
    }
}

debugInsertNoSelect();
