
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns for table "projects"...');

    // Since we can't easily access information_schema via JS client without admin rights or rpc,
    // we will try to insert a dummy row with all possible keys and see what sticks, or 
    // better yet, we can try to select * and look at the error/result if we can't inspect schema directly.
    // BUT the best way if we have the credentials is:

    // Actually, we can just try to SELECT one row. If it's empty, we can't see keys.
    // So we will try to INSERT a dummy row with a known ID, and then SELECT it, to see the keys.

    const dummyId = 'dummy-schema-check-' + Date.now();

    const { data: inserted, error: insertError } = await supabase
        .from('projects')
        .insert([{ id: dummyId, pekerjaan: 'SCHEMA_CHECK' }])
        .select();

    if (insertError) {
        console.error('Error inserting dummy row:', insertError);
        return;
    }

    if (inserted && inserted.length > 0) {
        console.log('Columns found:', Object.keys(inserted[0]));

        // Cleanup
        await supabase.from('projects').delete().eq('id', dummyId);
    } else {
        console.log('Inserted specific row but got no return data.');
    }
}

checkColumns();
