
import { createClient } from '@supabase/supabase-js';

// Hardcoded values from client.ts
const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function debugInsert() {
    console.log("Attempting to insert a row with NULL values for optional fields...");

    // Payload mimicking the fixed logic in DataDesa.tsx with NULLs
    const payload = {
        aksi_prioritas: null,
        perangkat_daerah: null,
        program: null,
        kegiatan: null,
        sub_kegiatan: null,
        pekerjaan: 'DEBUG INSERT WITH NULLS ' + Date.now(),
        pagu_anggaran: 0,
        kode_desa: 'KD01',
        desa: 'Test Desa',
        kode_kecamatan: 'KK01',
        kecamatan: 'Test Kecamatan',
        luas_wilayah: null,
        jumlah_penduduk: 0,
        jumlah_angka_kemiskinan: 0,
        jumlah_balita_stunting: 0,
        potensi_desa: null,
        keterangan: null,
        latitude: -8.5,
        longitude: 116.1
    };

    const { data, error } = await supabase.from('projects').insert([payload]).select();

    if (error) {
        console.error('INSERT FAILED!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Error Details:', error.details);
    } else {
        console.log('INSERT SUCCESS!');
        console.log('Inserted Data:', data);

        // Clean up
        const { error: delError } = await supabase.from('projects').delete().eq('id', data[0].id);
        if (delError) console.error("Could not clean up test row:", delError);
        else console.log("Cleaned up test row.");
    }
}

debugInsert();
