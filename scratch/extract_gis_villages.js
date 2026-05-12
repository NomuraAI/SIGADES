import fs from 'fs';

async function run() {
    try {
        const geojson = JSON.parse(fs.readFileSync('public/batas_desa.json', 'utf8'));
        const gisVillages = [...new Set(geojson.features.map(f => f.properties.DESA))].sort();
        
        console.log('GIS Villages Count:', gisVillages.length);
        fs.writeFileSync('scratch/gis_villages.json', JSON.stringify(gisVillages, null, 2));
        console.log('Saved to scratch/gis_villages.json');
    } catch (err) {
        console.error(err);
    }
}

run();
