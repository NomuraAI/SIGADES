export interface ProjectData {
    id: string;
    aksiPrioritas: string;
    perangkatDaerah: string;
    program: string;
    kegiatan: string;
    subKegiatan: string;
    pekerjaan: string;
    paguAnggaran: number;
    desa: string;
    kodeKecamatan?: string;
    kecamatan: string;
    luasWilayah: string;
    jumlahPenduduk: number;
    jumlahAngkaKemiskinan: number;
    jumlahBalitaStunting: number;
    keterangan: string;
    kodeDesa?: string;
    potensiDesa?: string; // Menambahkan kembali properti ini
    lat?: number;
    lng?: number;
}