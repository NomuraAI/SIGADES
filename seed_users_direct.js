import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function seed() {
    console.log('Attempting to seed "users" table...');
    const { data, error } = await supabase.from('users').insert([
        { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator Bapperida' },
        { username: 'user', password: 'user123', role: 'user', name: 'Staff Perencanaan' },
        { username: 'view', password: 'view123', role: 'viewer', name: 'Viewer Umum' }
    ]);
    
    if (error) {
        console.error('Error seeding users:', error.message);
        console.log('NOTE: This might be due to RLS (Row Level Security). You might need to run the SQL in Supabase Dashboard.');
    } else {
        console.log('Seeding successful!');
    }
}

seed();
