export interface ProjectData {
    id: string;
    aksiPrioritas: string;
    perangkatDaerah: string;
    program: string;
    kegiatan: string;
    subKegiatan: string;
    pekerjaan: string;
    paguAnggaran: number;
    kodeDesa: string;
    desaKelurahan: string;
    kodeKecamatan: string;
    kecamatan: string;
    latitude: number | null;
    longitude: number | null;
    luasWilayah: string;
    jumlahPenduduk: number;
    jumlahAngkaKemiskinan: number;
    jumlahBalitaStunting: number;
    potensiDesa: string;
    keterangan: string;
}