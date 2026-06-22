import { createClient } from '@supabase/supabase-js';

// Hardcoded for check
const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
    console.log('Checking "users" table...');
    const { data, error } = await supabase.from('users').select('*').limit(5);
    
    if (error) {
        console.error('Error checking users table:', error.message);
        if (error.message.includes('relation "users" does not exist')) {
            console.log('CLUE: The table "users" has NOT been created yet.');
        }
    } else {
        console.log('Users found:', data.length);
        console.log('Data:', data);
    }
}

check();
