import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('projects').select('data_version').not('data_version', 'is', null).limit(100);
    if (error) console.error(error);
    const versions = [...new Set(data.map(d => d.data_version))];
    console.log("Versions:", versions);
}
test();
