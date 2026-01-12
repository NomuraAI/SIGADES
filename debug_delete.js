
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function debugDelete() {
    console.log("Attempting to create and then delete a dummy row...");

    // 1. Create a dummy row
    const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert([{ pekerjaan: 'TO_BE_DELETED', desa: 'Debug Desa' }])
        .select();

    if (insertError) {
        console.error("Insert failed:", insertError);
        return;
    }

    const idToDelete = insertData[0].id;
    console.log("Created dummy row with ID:", idToDelete);

    // 2. Try to delete it
    const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', idToDelete);

    if (deleteError) {
        console.error("DELETE FAILED!");
        console.error(deleteError);
    } else {
        console.log("DELETE SUCCESS! Row deleted.");
    }
}

debugDelete();
