
import { createClient } from '@supabase/supabase-js';

// Hardcoded values from client.ts
const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkColumns() {
    console.log("Checking columns latitude and longitude...");
    // Try to select these columns. If they don't exist, it should throw an error.
    const { data, error } = await supabase.from('projects').select('latitude, longitude').limit(1);

    if (error) {
        console.error('Error fetching columns:', error.message);
        return;
    }

    console.log('Successfully selected columns latitude and longitude.');
    if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
    } else {
        console.log('Columns exist (query successful) but table is empty.');
    }
}

checkColumns();
