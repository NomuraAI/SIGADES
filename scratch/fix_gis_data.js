import fs from 'fs';

const geojsonPath = 'public/batas_desa.json';

// Peta koreksi: Nama di GIS -> Nama Baku di Database
const corrections = {
    "BELEKA": "BELEKE",
    "BUKITTINGGI": "BUKIT TINGGI",
    "NYUR LEMBANG": "NYURLEMBANG",
    "SARIBAYE": "SARIBAYA",
    "TAMAN SARI": "TAMANSARI"
};

async function fixGisData() {
    try {
        console.log('Membaca file GeoJSON...');
        const rawData = fs.readFileSync(geojsonPath, 'utf8');
        const geojson = JSON.parse(rawData);

        let countFixed = 0;

        geojson.features.forEach(feature => {
            if (feature.properties && feature.properties.DESA) {
                let originalName = feature.properties.DESA.toUpperCase().trim();
                
                // Cek apakah ada di daftar koreksi
                if (corrections[originalName]) {
                    console.log(`Mengoreksi: ${feature.properties.DESA} -> ${corrections[originalName]}`);
                    feature.properties.DESA = corrections[originalName];
                    countFixed++;
                } else {
                    // Jika tidak ada koreksi khusus, tetap jadikan Uppercase agar seragam
                    feature.properties.DESA = originalName;
                }
            }
        });

        console.log(`\nSelesai! Total ${countFixed} desa dikoreksi secara spesifik.`);
        console.log(`Semua nama desa (122) sekarang menggunakan HURUF KAPITAL.`);

        fs.writeFileSync(geojsonPath, JSON.stringify(geojson));
        console.log(`File berhasil disimpan ke: ${geojsonPath}`);

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

fixGisData();
