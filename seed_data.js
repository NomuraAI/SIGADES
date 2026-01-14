import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const sampleData = [
    {
        desa: 'Senggigi',
        kecamatan: 'Batulayar',
        pekerjaan: 'Pembangunan Jalan di Senggigi',
        latitude: -8.4900,
        longitude: 116.0500,
        kode_desa: 'SNG01',
        kode_kecamatan: 'BTL01',
    },
    {
        desa: 'Kediri',
        kecamatan: 'Kediri',
        pekerjaan: 'Renovasi Balai Desa Kediri',
        latitude: -8.6500,
        longitude: 116.1500,
        kode_desa: 'KDR01',
        kode_kecamatan: 'KDR00',
    },
    {
        desa: 'Batu Layar',
        kecamatan: 'Batulayar',
        pekerjaan: 'Proyek Irigasi',
        latitude: -8.5100,
        longitude: 116.0700,
        kode_desa: 'BTL02',
        kode_kecamatan: 'BTL01',
    }
];

async function seedData() {
    console.log('Seeding data...');
    const { data, error } = await supabase.from('projects').insert(sampleData).select();

    if (error) {
        console.error('Seed failed:', error);
    } else {
        console.log('Seed successful. Inserted:', data.length, 'rows.');
    }
}

seedData();
