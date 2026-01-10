import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log(`Checking connection to: ${supabaseUrl}`);

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        // Try to fetch something generic. Even if table doesn't exist, it proves connection.
        const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

        if (error) {
            // Check specifically for connection errors
            if (error.code === 'PGRST116' || error.message.includes('FetchError') || error.message.includes('network')) {
                console.error('Connection Failed:', error.message);
            } else if (error.code === '42P01') {
                // Table does not exist, but connection worked!
                console.log('Connection Successful! (Connected to Supabase, but table "projects" not found which is expected if not set up yet)');
            } else {
                console.log('Connection Successful! (Received response from Supabase)');
                console.log('Response:', error.message);
            }
        } else {
            console.log('Connection Successful! (Query executed)');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkConnection();
