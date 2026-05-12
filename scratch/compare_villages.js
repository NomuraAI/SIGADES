import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://xzozhzitylsbjjnihfjr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6b3poeml0eWxzYmpqbmloZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIyMTAsImV4cCI6MjA4MzUzODIxMH0.ony_gQA1BXuW8Rwu80zMxPtwH-YhJJOl0w8VauX_vTE";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
    try {
        let allData = [];
        let from = 0;
        let step = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('projects')
                .select('desa_kelurahan')
                .range(from, from + step - 1);

            if (error) throw error;
            if (data.length === 0) {
                hasMore = false;
            } else {
                allData = [...allData, ...data];
                from += step;
            }
        }

        const dbVillages = [...new Set(allData.map(d => d.desa_kelurahan).filter(Boolean))].sort();
        console.log('DB Villages Count:', dbVillages.length);
        fs.writeFileSync('scratch/db_villages.json', JSON.stringify(dbVillages, null, 2));
        console.log('Saved to scratch/db_villages.json');

        // Load GIS villages
        const gisVillages = JSON.parse(fs.readFileSync('scratch/gis_villages.json', 'utf8'));

        // Compare
        const gisSet = new Set(gisVillages.map(v => v.trim().toUpperCase()));
        const dbSet = new Set(dbVillages.map(v => v.trim().toUpperCase()));

        const onlyInGis = gisVillages.filter(v => !dbSet.has(v.trim().toUpperCase()));
        const onlyInDb = dbVillages.filter(v => !gisSet.has(v.trim().toUpperCase()));

        console.log('\n--- Differences ---');
        console.log('In GIS but NOT in DB (might be typo in DB or missing data):');
        console.log(onlyInGis);

        console.log('\nIn DB but NOT in GIS (might be typo in DB or new village):');
        console.log(onlyInDb);

        // Check for fuzzy matches (small typos)
        console.log('\n--- Possible Typos (Fuzzy Match) ---');
        onlyInDb.forEach(dbV => {
            gisVillages.forEach(gisV => {
                const distance = levenshtein(dbV.toUpperCase(), gisV.toUpperCase());
                if (distance > 0 && distance <= 2) {
                    console.log(`DB: "${dbV}" <-> GIS: "${gisV}" (Distance: ${distance})`);
                }
            });
        });

    } catch (err) {
        console.error(err);
    }
}

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

run();
